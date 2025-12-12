import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  const url = new URL(req.url);
  console.log("Request received:", url.pathname, "Method:", req.method);

  // ===== ENDPOINT: /twiml =====
  if (url.pathname.endsWith("/twiml")) {
    const baseUrl = url.origin + url.pathname.replace("/twiml", "");
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Please wait while I connect you to our AI receptionist</Say>
  <Connect>
    <Stream url="wss://${url.host}${url.pathname.replace("/twiml", "/media-stream")}" />
  </Connect>
</Response>`;

    console.log("Returning TwiML with stream URL");
    return new Response(twiml, {
      headers: { 
        "Content-Type": "application/xml",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }

  // ===== ENDPOINT: /media-stream (WebSocket) =====
  if (url.pathname.endsWith("/media-stream")) {
    console.log("Upgrading to WebSocket for media stream");

    const { socket: twilioSocket, response } = Deno.upgradeWebSocket(req);

    let openaiSocket: WebSocket | null = null;
    let streamSid: string | null = null;
    let conversationId: string | null = null;
    const fnArgs: Record<string, string> = {};

    const connectOpenAI = () => {
      if (openaiSocket) return;

      console.log("🔌 Connecting to OpenAI Realtime API...");
      openaiSocket = new WebSocket(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
        [
          "realtime",
          `openai-insecure-api-key.${OPENAI_API_KEY}`,
          "openai-beta.realtime-v1",
        ]
      );

      openaiSocket.onopen = () => {
        console.log("✅ OpenAI WebSocket connected successfully");
      };

      openaiSocket.onmessage = async (event) => {
        const response = JSON.parse(event.data);

        if (response.type !== "response.audio.delta" && response.type !== "input_audio_buffer.speech_started") {
          console.log("🤖 OpenAI event:", response.type);
        }

        if (response.type === "session.created") {
          console.log("🆗 OpenAI session.created received, loading agent config...");

          let instructionsText = "You are a helpful restaurant receptionist.";
          try {
            const { data: config } = await supabase
              .from('agent_config')
              .select('*')
              .limit(1)
              .maybeSingle();

            if (config) {
              instructionsText = `You are a receptionist for ${config.restaurant_name}.
Hours: ${config.restaurant_hours}
Menu: ${config.menu}
${config.instructions}

When a customer wants to make a reservation, collect the following information:
1. Their name
2. Their email address (important for confirmation)
3. The date they want to dine
4. The time they prefer
5. Number of guests

Once you have all information, use the create_reservation function to book their table.`;
            }
          } catch (e) {
            console.error('Failed to load agent config:', e);
          }

          console.log("📝 Sending session.update with loaded instructions");
          openaiSocket!.send(
            JSON.stringify({
              type: "session.update",
              session: {
                modalities: ["text", "audio"],
                instructions: instructionsText,
                voice: "alloy",
                input_audio_format: "g711_ulaw",
                output_audio_format: "g711_ulaw",
                input_audio_transcription: { model: "whisper-1" },
                turn_detection: {
                  type: "server_vad",
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 1000,
                },
                temperature: 0.8,
                tools: [
                  {
                    type: "function",
                    name: "create_reservation",
                    description: "Create a restaurant reservation with customer details. Use this when a customer wants to book a table.",
                    parameters: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Customer's full name" },
                        email: { type: "string", description: "Customer's email address for confirmation" },
                        date: { type: "string", description: "Reservation date in YYYY-MM-DD format" },
                        time: { type: "string", description: "Reservation time in HH:MM format (24-hour)" },
                        guests: { type: "number", description: "Number of guests" }
                      },
                      required: ["name", "email", "date", "time", "guests"],
                      additionalProperties: false
                    }
                  }
                ],
                tool_choice: "auto",
              },
            })
          );
        }

        if (response.type === "response.audio.delta" && streamSid) {
          twilioSocket.send(
            JSON.stringify({
              event: "media",
              streamSid: streamSid,
              media: { payload: response.delta },
            })
          );
        }

        if (response.type === "response.audio.done") {
          console.log("🔊 Audio response completed");
        }

        if (response.type === "response.function_call_arguments.delta") {
          const { call_id, delta } = response;
          fnArgs[call_id] = (fnArgs[call_id] || "") + delta;
        }

        if (response.type === "response.function_call_arguments.done") {
          try {
            const { call_id } = response;
            const argsStr = fnArgs[call_id] || response.arguments || "{}";
            delete fnArgs[call_id];
            const args = JSON.parse(argsStr);
            console.log("🛠️ Function call - create_reservation:", args);

            const insertPayload: Record<string, unknown> = {
              date: args.date,
              time: (args.time?.length === 5 ? args.time + ":00" : args.time) || null,
              guests: Number(args.guests) || 1,
              name: args.name,
              email: args.email,
              status: "confirmed",
            };
            if (conversationId) insertPayload.conversation_id = conversationId;

            const { data: resv, error: resvErr } = await supabase
              .from('reservations')
              .insert(insertPayload)
              .select('*')
              .maybeSingle();

            if (resvErr) {
              console.error('❌ Failed to create reservation:', resvErr);
              openaiSocket!.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'function_call_output',
                  call_id: call_id,
                  output: JSON.stringify({ success: false, error: resvErr.message })
                }
              }));
            } else {
              console.log('✅ Reservation stored:', resv?.id);

              // Send confirmation email
              try {
                const { data: config } = await supabase
                  .from('agent_config')
                  .select('restaurant_name')
                  .limit(1)
                  .maybeSingle();

                await supabase.functions.invoke('send-reservation-confirmation', {
                  body: {
                    name: args.name,
                    email: args.email,
                    date: args.date,
                    time: args.time,
                    guests: args.guests,
                    restaurantName: config?.restaurant_name || 'Restaurant'
                  }
                });
                console.log('📧 Confirmation email sent');
              } catch (emailErr) {
                console.error('⚠️ Failed to send email:', emailErr);
              }

              openaiSocket!.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'function_call_output',
                  call_id: call_id,
                  output: JSON.stringify({ 
                    success: true, 
                    message: `Reservation confirmed for ${args.name} on ${args.date} at ${args.time} for ${args.guests} guests. A confirmation email has been sent to ${args.email}.`
                  })
                }
              }));
            }

            openaiSocket!.send(JSON.stringify({ type: 'response.create' }));
          } catch (e) {
            console.error('❌ Error handling tool call:', e);
          }
        }

        if (response.type === "error") {
          console.error("❌ OpenAI error event:", response.error);
        }
      };

      openaiSocket.onerror = (error: Event) => {
        console.error("❌ OpenAI WebSocket error:", error);
      };

      openaiSocket.onclose = (event: CloseEvent) => {
        console.log("🔴 OpenAI WebSocket closed:", event.code, event.reason);
      };
    };

    twilioSocket.onopen = () => {
      console.log("✅ Twilio WebSocket connected");
    };

    twilioSocket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.event === "start") {
          streamSid = data.start.streamSid;
          console.log("📞 Stream started:", streamSid);

          try {
            const { data: conv, error: convErr } = await supabase
              .from('conversations')
              .insert({ status: 'active' })
              .select('id')
              .maybeSingle();
            if (convErr) {
              console.error('❌ Failed to create conversation:', convErr);
            } else if (conv?.id) {
              conversationId = conv.id;
              console.log('🗂️ Conversation created:', conversationId);
            }
          } catch (e) {
            console.error('❌ Error creating conversation:', e);
          }

          connectOpenAI();
        }

        if (data.event === "media" && !openaiSocket) {
          if (!streamSid && data.streamSid) {
            streamSid = data.streamSid;
            console.log("ℹ️ Inferred streamSid from media:", streamSid);
          }
          console.log("⚠️ OpenAI not connected yet. Connecting now...");
          connectOpenAI();
        }

        if (data.event === "media" && openaiSocket?.readyState === WebSocket.OPEN) {
          openaiSocket.send(
            JSON.stringify({
              type: "input_audio_buffer.append",
              audio: data.media.payload,
            })
          );
        }

        if (data.event === "stop") {
          console.log("📞 Stream stopped");
          try {
            if (conversationId) {
              const { error: updErr } = await supabase
                .from('conversations')
                .update({ status: 'completed', ended_at: new Date().toISOString() })
                .eq('id', conversationId);
              if (updErr) console.error('❌ Failed to update conversation:', updErr);
              else console.log('🗂️ Conversation completed:', conversationId);
            }
          } catch (e) {
            console.error('❌ Error updating conversation:', e);
          }
          openaiSocket?.close();
        }
      } catch (error) {
        console.error("Error handling Twilio message:", error);
      }
    };

    twilioSocket.onerror = (error) => {
      console.error("❌ Twilio WebSocket error:", error);
    };

    twilioSocket.onclose = () => {
      console.log("📞 Twilio disconnected");
      openaiSocket?.close();
    };

    return response;
  }

  return new Response("Twilio Voice Agent - Use /twiml or /media-stream endpoints", { 
    status: 200,
    headers: { "Content-Type": "text/plain" }
  });
});
