"use client";

import { useEffect, useState } from "react";
import useApi from "@/hook/useApi";

export default function AgoraVoiceCall() {
  const [agoraInfo, setAgoraInfo] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null);
  const [muted, setMuted] = useState(false);

  const { callApi, isLoading, error } = useApi<any>();

  // Fetch Agora token from backend
  useEffect(() => {
  const fetchAgoraToken = async () => {
    const data = await callApi({ method: "GET", url: "/chat/agora-token?channelName=hi" });
    if (data) setAgoraInfo(data);
  };
  fetchAgoraToken();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  // Initialize Agora voice call
  useEffect(() => {
    if (!agoraInfo) return;

    let rtcClient: any;
    let microphoneTrack: any;
    let mounted = true;

    const initAgora = async () => {
      try {
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        rtcClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        setClient(rtcClient);

        // Let Agora assign a unique UID automatically to avoid conflicts
        const uid = null;
        await rtcClient.join(agoraInfo.appId, agoraInfo.channelName, agoraInfo.token, uid);

        // Create and publish local audio track
        microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack();
        if (!mounted) return;
        setLocalAudioTrack(microphoneTrack);
        await rtcClient.publish([microphoneTrack]);

        // Subscribe to remote users' audio
        rtcClient.on("user-published", async (user: any, mediaType: string) => {
          await rtcClient.subscribe(user, mediaType);
          if (mediaType === "audio") user.audioTrack?.play();
        });

        rtcClient.on("user-unpublished", (user: any) => {
          user.audioTrack?.stop();
        });
      } catch (err) {
        console.error("Agora init error:", err);
      }
    };

    initAgora();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (microphoneTrack) microphoneTrack.close().catch(() => {});
      if (rtcClient) rtcClient.leave().catch(() => {});
    };
  }, [agoraInfo]);

  const toggleMute = () => {
    if (!localAudioTrack) return;
    if (muted) {
      localAudioTrack.setEnabled(true);
      setMuted(false);
    } else {
      localAudioTrack.setEnabled(false);
      setMuted(true);
    }
  };

  if (isLoading) return <div>Loading voice call...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!agoraInfo) return <div>Fetching token...</div>;

  return (
    <div>
      <h1>Agora Voice Call</h1>
      <button onClick={toggleMute}>{muted ? "Unmute Microphone" : "Mute Microphone"}</button>
    </div>
  );
}
