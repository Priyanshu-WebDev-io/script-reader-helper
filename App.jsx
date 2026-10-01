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

  const {
    currentScript,
    wpm,
    setScript,
    setWpm
  } = useStudioStore();

  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-resolve-bg">
        {currentScreen === 'gallery' ? (
          <GalleryScreen
            onStartNewRecording={() => setCurrentScreen('studio')}
            onOpenScriptEditor={() => setIsScriptModalOpen(true)}
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
          onSaveScript={(rawText, title) => setScript(rawText, title)}
          onWpmChange={(newWpm) => setWpm(newWpm)}
        />
      </View>
    </SafeAreaProvider>
  );
}
