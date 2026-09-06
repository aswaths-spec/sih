import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Language } from '../i18n/translations';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  language: Language;
  disabled?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  language,
  disabled = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      // Set language code based on selected app language
      if (language === 'hi') {
        recognition.lang = 'hi-IN';
      } else if (language === 'mr') {
        recognition.lang = 'mr-IN';
      } else if (language === 'ta') {
        recognition.lang = 'ta-IN';
      } else {
        recognition.lang = 'en-IN';
      }

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      setSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language, onTranscript]);

  const toggleListening = () => {
    if (!supported || disabled) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Could not start recognition:', err);
      }
    }
  };

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        title="Speech recognition is not supported in this browser environment."
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 bg-slate-100 rounded-md cursor-not-allowed border border-slate-200"
      >
        <MicOff className="w-3.5 h-3.5" />
        <span>Voice input unavailable</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      id="btn-voice-input"
      onClick={toggleListening}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
        isListening
          ? 'bg-rose-50 border-rose-400 text-rose-700 animate-pulse ring-2 ring-rose-200'
          : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
      }`}
    >
      {isListening ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
          </span>
          <Mic className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
          <span>Listening ({language.toUpperCase()})... Tap to finish</span>
        </>
      ) : (
        <>
          <Mic className="w-3.5 h-3.5 text-emerald-700" />
          <span>Speak Symptoms ({language.toUpperCase()})</span>
        </>
      )}
    </button>
  );
};
