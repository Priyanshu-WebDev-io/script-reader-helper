import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';
import { Mic } from 'lucide-react-native';

export function VUMeter({ isRecording, rawDecibel }) {
  const meterHeight = useSharedValue(10);
  const [dbLabel, setDbLabel] = useState('MIC');
  const [isPeaking, setIsPeaking] = useState(false);

  useEffect(() => {
    let interval = null;

    if (isRecording) {
      interval = setInterval(() => {
        const randomDb = rawDecibel ?? (35 + Math.random() * 45);
        meterHeight.value = withTiming(Math.min(100, Math.max(5, randomDb)), { duration: 80 });

        if (randomDb > 85) {
          setDbLabel('CLIP');
          setIsPeaking(true);
        } else if (randomDb > 25) {
          setDbLabel('ARMED');
          setIsPeaking(false);
        } else {
          setDbLabel('IDLE');
          setIsPeaking(false);
        }
      }, 100);
    } else {
      meterHeight.value = withTiming(8, { duration: 200 });
      setDbLabel('OFF');
      setIsPeaking(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, rawDecibel]);

  const animatedFillStyle = useAnimatedStyle(() => ({
    height: `${meterHeight.value}%`
  }));

  return (
    <View className="bg-resolve-panel border border-resolve-border py-1 px-2 rounded-xs flex-row items-center gap-2">
      <View className="flex-row items-center gap-1">
        <Mic size={11} color={isRecording ? '#DEDEDE' : '#888888'} />
        <Text className={`font-mono text-[9px] font-bold tracking-wider ${
          isPeaking 
            ? 'text-resolve-crimson' 
            : isRecording 
              ? 'text-resolve-accent' 
              : 'text-resolve-muted'
        }`}>
          {dbLabel}
        </Text>
      </View>

      {/* Fairlight NLE Vertical Audio Level Bar */}
      <View className="w-1.5 h-6 bg-resolve-recessed border border-resolve-border/60 rounded-none overflow-hidden justify-end">
        <Animated.View 
          className={`w-full ${isPeaking ? 'bg-resolve-crimson' : 'bg-resolve-accent'}`}
          style={animatedFillStyle} 
        />
        <View className="absolute top-[30%] left-0 right-0 h-[1px] bg-resolve-border" />
      </View>
    </View>
  );
}
