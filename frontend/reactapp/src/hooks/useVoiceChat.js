import { useState, useRef, useEffect, useCallback } from "react";

export function useVoiceChat(wsRef, myUserId) {
  const [inVoiceCall, setInVoiceCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState([]);
  
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const audioElementsRef = useRef({});
  const simplePeerLoadedRef = useRef(false);

  // Load SimplePeer
  useEffect(() => {
    const loadSimplePeer = () => {
      if (window.SimplePeer || simplePeerLoadedRef.current) {
        simplePeerLoadedRef.current = true;
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/simple-peer/9.11.1/simplepeer.min.js';
        script.onload = () => {
          simplePeerLoadedRef.current = true;
          resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };
    loadSimplePeer();
  }, []);

  const createPeer = useCallback((userId, initiator, stream) => {
    if (!window.SimplePeer) return null;

    const peer = new window.SimplePeer({ 
      initiator, 
      trickle: false, 
      stream,
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
    });

    peer.on('signal', signal => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ 
          type: 'voice_signal', 
          target_user: userId, 
          signal_data: signal 
        }));
      }
    });

    peer.on('stream', remoteStream => {
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.autoplay = true;
      audioElementsRef.current[userId] = audio;
      audio.play().catch(e => console.error("Audio play failed", e));
    });

    peer.on('close', () => {
      if (audioElementsRef.current[userId]) {
        audioElementsRef.current[userId].pause();
        delete audioElementsRef.current[userId];
      }
    });

    peersRef.current[userId] = peer;
    return peer;
  }, [wsRef]);

  const handleVoiceSignal = useCallback((fromUser, signalData) => {
    if (!localStreamRef.current) return;
    let peer = peersRef.current[fromUser];
    if (!peer) peer = createPeer(fromUser, false, localStreamRef.current);
    if (peer) peer.signal(signalData);
  }, [createPeer]);

  const joinCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setInVoiceCall(true);
      setIsMuted(false);
      wsRef.current?.send(JSON.stringify({ type: 'join_voice' }));
    } catch (err) {
      alert("Microphone access denied.");
    }
  }, [wsRef]);

  const leaveCall = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'leave_voice' }));
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    Object.values(peersRef.current).forEach(p => p.destroy());
    peersRef.current = {};
    setParticipants([]);
    setInVoiceCall(false);
  }, [wsRef]);

  // Sync participants
  useEffect(() => {
    if (!localStreamRef.current || !myUserId) return;
    const myIdStr = myUserId.toString();
    
    participants.forEach(p => {
      if (p.id !== myIdStr && !peersRef.current[p.id]) {
        const shouldInitiate = myIdStr > p.id;
        createPeer(p.id, shouldInitiate, localStreamRef.current);
      }
    });
    
    // Cleanup dropped users
    Object.keys(peersRef.current).forEach(uid => {
      if (!participants.some(p => p.id === uid)) {
        peersRef.current[uid].destroy();
        delete peersRef.current[uid];
      }
    });
  }, [participants, myUserId, createPeer]);

  const toggleMute = useCallback(() => {
     if(localStreamRef.current) {
        const track = localStreamRef.current.getAudioTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            setIsMuted(!track.enabled);
        }
     }
  }, []);

  useEffect(() => leaveCall, [leaveCall]);

  return { inVoiceCall, isMuted, participants, joinCall, leaveCall, toggleMute, setParticipants, handleVoiceSignal };
}