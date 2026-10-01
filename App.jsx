import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GalleryScreen } from './src/components/GalleryScreen';
import { StudioScreen } from './src/components/StudioScreen';
import { ScriptModal } from './src/components/ScriptModal';
import { useStudioStore } from './src/store/useStudioStore';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('gallery'); // 'gallery' | 'studio'
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [scriptModalMode, setScriptModalMode] = useState('import'); // 'import' | 'record'

  const {
    currentScript,
    wpm,
    setScript,
    setWpm
  } = useStudioStore();

  const handleOpenScriptEditor = (mode = 'import') => {
    setScriptModalMode(mode);
    setIsScriptModalOpen(true);
  };

  const handleSaveScript = (rawText, title) => {
    setScript(rawText, title);
    if (scriptModalMode === 'record') {
      setCurrentScreen('studio');
    }
  };

  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-resolve-bg">
        {currentScreen === 'gallery' ? (
          <GalleryScreen
            onStartNewRecording={() => setCurrentScreen('studio')}
            onOpenScriptEditor={handleOpenScriptEditor}
          />
        ) : (
          <StudioScreen
            onExit={() => setCurrentScreen('gallery')}
          />
        )}

        <ScriptModal
          visible={isScriptModalOpen}
          onClose={() => setIsScriptModalOpen(false)}
          currentScript={currentScript}
          wpm={wpm}
          mode={scriptModalMode}
          onSaveScript={handleSaveScript}
          onConfirmRecord={() => {
            setCurrentScreen('studio');
          }}
          onWpmChange={(newWpm) => setWpm(newWpm)}
        />
      </View>
    </SafeAreaProvider>
  );
}
