import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Video,
  FileText,
  Plus,
  Film,
  Trash2,
  Clock,
  Layers,
  Sliders,
  FolderOpen
} from 'lucide-react-native';
import { useStudioStore } from '../store/useStudioStore';

export function GalleryScreen({ onStartNewRecording, onOpenScriptEditor }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'videos' | 'scripts'

  const {
    scripts,
    savedVideos,
    loadPresetScript,
    deleteSavedVideo
  } = useStudioStore();

  const handleSelectScriptToRecord = (script) => {
    loadPresetScript(script.id);
    onStartNewRecording();
  };

  const videoItems = (savedVideos || []).map(v => ({ ...v, type: 'video' }));
  const scriptItems = (scripts || []).map(s => ({ ...s, type: 'script' }));

  let displayedItems = [];
  if (activeTab === 'all') {
    displayedItems = [...videoItems, ...scriptItems];
  } else if (activeTab === 'videos') {
    displayedItems = videoItems;
  } else {
    displayedItems = scriptItems;
  }

  const renderItem = ({ item }) => {
    if (item.type === 'video') {
      return (
        <View className="bg-resolve-panel border border-resolve-border rounded-sm p-3 mb-2.5">
          <View className="flex-row items-center justify-between pb-2 mb-2 border-b border-resolve-border/60">
            <View className="flex-row items-center gap-2 flex-1 mr-2">
              <View className="w-6 h-6 bg-resolve-recessed border border-resolve-border rounded-xs items-center justify-center">
                <Film size={12} color="#DEDEDE" />
              </View>
              <View className="flex-1">
                <Text className="text-resolve-text text-xs font-bold" numberOfLines={1}>
                  {item.title || 'RECORDED_TIMELINE.mp4'}
                </Text>
                <Text className="text-resolve-muted text-[10px]">
                  {item.date ? new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Exported Take'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              className="p-1.5 bg-resolve-recessed border border-resolve-border rounded-xs"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => deleteSavedVideo(item.id)}
              activeOpacity={0.7}
            >
              <Trash2 size={13} color="#888888" />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-between pt-1">
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center gap-1 bg-resolve-recessed px-1.5 py-0.5 border border-resolve-border/80 rounded-xs">
                <Clock size={11} color="#888888" />
                <Text className="text-resolve-text font-mono text-[10px]">{item.duration || '00:00:30'}</Text>
              </View>
              {item.takesCount && (
                <View className="flex-row items-center gap-1 bg-resolve-recessed px-1.5 py-0.5 border border-resolve-border/80 rounded-xs">
                  <Layers size={11} color="#888888" />
                  <Text className="text-resolve-muted font-mono text-[10px]">{item.takesCount} TAKES</Text>
                </View>
              )}
            </View>

            <View className="bg-resolve-recessed px-2 py-0.5 border border-resolve-border rounded-xs">
              <Text className="text-resolve-accent font-mono text-[9px] font-bold tracking-wider uppercase">RENDERED CLIP</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View className="bg-resolve-panel border border-resolve-border rounded-sm p-3 mb-2.5">
        <View className="flex-row items-center justify-between pb-2 mb-2 border-b border-resolve-border/60">
          <View className="flex-row items-center gap-2 flex-1 mr-2">
            <View className="w-6 h-6 bg-resolve-recessed border border-resolve-border rounded-xs items-center justify-center">
              <FileText size={12} color="#DEDEDE" />
            </View>
            <View className="flex-1">
              <Text className="text-resolve-text text-xs font-bold" numberOfLines={1}>
                {item.title}
              </Text>
              <Text className="text-resolve-muted text-[10px]">
                BIN: {item.category || 'MASTER'} • {item.defaultWpm || 150} WPM
              </Text>
            </View>
          </View>

          <View className="bg-resolve-recessed px-1.5 py-0.5 border border-resolve-border rounded-xs">
            <Text className="text-resolve-muted font-mono text-[9px] font-bold tracking-wider uppercase">SCRIPT</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between pt-1">
          <View className="flex-row items-center gap-1 bg-resolve-recessed px-1.5 py-0.5 border border-resolve-border/80 rounded-xs">
            <Clock size={11} color="#888888" />
            <Text className="text-resolve-muted font-mono text-[10px]">{item.targetDuration || '00:01:00'}</Text>
          </View>

          <TouchableOpacity
            className="flex-row items-center gap-1.5 bg-resolve-crimson px-3 py-1.5 rounded-xs border border-resolve-crimsonDark"
            onPress={() => handleSelectScriptToRecord(item)}
            activeOpacity={0.8}
          >
            <Video size={12} color="#FFFFFF" />
            <Text className="text-white text-[10px] font-bold uppercase tracking-wider">LOAD TO MONITOR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View
      className="flex-1 bg-resolve-bg"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="#181818" />

      {/* DaVinci Resolve Top Toolbar & Header */}
      <View className="bg-resolve-header border-b border-resolve-border px-4 py-2.5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="w-2.5 h-2.5 bg-resolve-accent rounded-none" />
          <View>
            <Text className="text-resolve-text text-xs font-bold tracking-wider uppercase">RESOLVE STUDIO</Text>
            <Text className="text-resolve-muted text-[10px] tracking-tight">MEDIA POOL & PROJECT BINS</Text>
          </View>
        </View>

        <TouchableOpacity
          className="flex-row items-center gap-1.5 bg-resolve-panel border border-resolve-border rounded-xs px-2.5 py-1.5 active:bg-resolve-border"
          onPress={onOpenScriptEditor}
          activeOpacity={0.8}
        >
          <Plus size={12} color="#DEDEDE" />
          <Text className="text-resolve-text text-[11px] font-semibold tracking-wide uppercase">IMPORT SCRIPT</Text>
        </TouchableOpacity>
      </View>

      {/* NLE Workspace Tabs */}
      <View className="flex-row bg-resolve-recessed border-b border-resolve-border px-2">
        <TouchableOpacity
          className={`px-3 py-2 border-b-2 flex-row items-center gap-1.5 ${activeTab === 'all'
              ? 'border-resolve-accent bg-resolve-panel'
              : 'border-transparent'
            }`}
          onPress={() => setActiveTab('all')}
        >
          <FolderOpen size={11} color={activeTab === 'all' ? '#F26D21' : '#888888'} />
          <Text className={`text-[11px] font-semibold uppercase tracking-wider ${activeTab === 'all' ? 'text-resolve-text' : 'text-resolve-muted'
            }`}>
            ALL MEDIA ({displayedItems.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`px-3 py-2 border-b-2 flex-row items-center gap-1.5 ${activeTab === 'videos'
              ? 'border-resolve-accent bg-resolve-panel'
              : 'border-transparent'
            }`}
          onPress={() => setActiveTab('videos')}
        >
          <Film size={11} color={activeTab === 'videos' ? '#F26D21' : '#888888'} />
          <Text className={`text-[11px] font-semibold uppercase tracking-wider ${activeTab === 'videos' ? 'text-resolve-text' : 'text-resolve-muted'
            }`}>
            TIMELINES ({savedVideos?.length || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`px-3 py-2 border-b-2 flex-row items-center gap-1.5 ${activeTab === 'scripts'
              ? 'border-resolve-accent bg-resolve-panel'
              : 'border-transparent'
            }`}
          onPress={() => setActiveTab('scripts')}
        >
          <FileText size={11} color={activeTab === 'scripts' ? '#F26D21' : '#888888'} />
          <Text className={`text-[11px] font-semibold uppercase tracking-wider ${activeTab === 'scripts' ? 'text-resolve-text' : 'text-resolve-muted'
            }`}>
            SCRIPTS ({scripts?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Media Bin List */}
      <FlatList
        data={displayedItems}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12, paddingBottom: 85 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-20 px-6">
            <View className="w-12 h-12 bg-resolve-panel border border-resolve-border rounded-xs items-center justify-center mb-3">
              <Film size={22} color="#555555" />
            </View>
            <Text className="text-resolve-text text-xs font-bold uppercase tracking-wider mb-1">
              BIN EMPTY
            </Text>
            <Text className="text-resolve-muted text-[11px] text-center max-w-[220px]">
              No media or scripts in current project bin. Import a script or start recording.
            </Text>
          </View>
        }
      />

      {/* DaVinci Resolve Master Record Bar */}
      <View className="absolute bottom-0 left-0 right-0 p-3 bg-resolve-header/95 border-t border-resolve-border">
        <TouchableOpacity
          className="flex-row items-center justify-center gap-2 bg-resolve-crimson border border-resolve-crimsonDark rounded-xs py-2.5 px-4 active:opacity-90"
          activeOpacity={0.85}
          onPress={onStartNewRecording}
        >
          <View className="w-2.5 h-2.5 bg-white rounded-none" />
          <Text className="text-white text-xs font-bold uppercase tracking-wider">
            ARM NEW RECORDING SESSION
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
