import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
  LayoutAnimation,
  Alert,
  Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Video,
  FileText,
  Plus,
  Film,
  Trash2,
  FolderOpen,
  Info,
  FileCode,
  X
} from 'lucide-react-native';
import { useStudioStore } from '../store/useStudioStore';

export function GalleryScreen({ onStartNewRecording, onOpenScriptEditor }) {
  const insets = useSafeAreaInsets();

  // Track which items have their "Inspector" panel expanded
  const [expandedItems, setExpandedItems] = useState(new Set());
  // Modal to choose record mode (with script vs without script)
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const {
    scripts,
    savedVideos,
    loadPresetScript,
    setFreeRecordingMode,
    deleteSavedVideo,
    deleteScript
  } = useStudioStore();

  const confirmDeleteVideo = (id, title) => {
    Alert.alert(
      'Delete Video',
      `Delete "${title || 'this video'}" from your project bin?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteSavedVideo(id) }
      ]
    );
  };

  const confirmDeleteScript = (id, title) => {
    Alert.alert(
      'Delete Script',
      `Delete "${title || 'this script'}" from your project bin?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteScript(id) }
      ]
    );
  };

  const handleSelectScriptToRecord = (script) => {
    loadPresetScript(script.id);
    onStartNewRecording();
  };

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const videoItems = (savedVideos || []).map(v => ({ ...v, type: 'video' }));
  const scriptItems = (scripts || []).map(s => ({ ...s, type: 'script' }));
  const displayedItems = [...videoItems, ...scriptItems];

  const renderItem = ({ item }) => {
    const isExpanded = expandedItems.has(item.id);

    // ------------------------------------------------------------------
    // VIDEO ITEM
    // ------------------------------------------------------------------
    if (item.type === 'video') {
      return (
        <View className="bg-resolve-panel border border-resolve-border rounded-xs mb-2.5 overflow-hidden">
          {/* PRIMARY ROW (Always visible) */}
          <View className="p-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5 flex-1 mr-2">
              <View className="w-8 h-8 bg-resolve-recessed border border-resolve-border rounded-xs items-center justify-center">
                <Film size={15} color="#F26D21" />
              </View>
              <View className="flex-1">
                <Text className="text-resolve-text font-mono text-xs font-bold" numberOfLines={1}>
                  {item.title || 'Recorded Timeline'}
                </Text>
                <Text className="text-resolve-muted font-mono text-[10px] mt-0.5">
                  {item.date ? new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Session Clip'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                className={`p-1.5 rounded-xs border ${isExpanded ? 'bg-resolve-accent border-resolve-accent' : 'bg-resolve-recessed border-resolve-border'} active:opacity-80`}
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.7}
              >
                <Info size={13} color={isExpanded ? '#000000' : '#888888'} />
              </TouchableOpacity>

              <TouchableOpacity
                className="p-1.5 bg-resolve-recessed border border-resolve-border rounded-xs active:bg-resolve-crimson/20"
                onPress={() => confirmDeleteVideo(item.id, item.title)}
                activeOpacity={0.7}
              >
                <Trash2 size={13} color="#888888" />
              </TouchableOpacity>
            </View>
          </View>

          {/* INSPECTOR PANEL (Advanced details, hidden by default) */}
          {isExpanded && (
            <View className="bg-resolve-recessed border-t border-resolve-border p-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-resolve-muted font-mono text-[9px] font-bold tracking-wider uppercase">
                  TIMELINE INSPECTOR
                </Text>
                <View className="bg-resolve-panel px-1.5 py-0.5 border border-resolve-border rounded-xs">
                  <Text className="text-resolve-accent font-mono text-[9px] font-bold tracking-wider uppercase">
                    RENDERED MEDIA
                  </Text>
                </View>
              </View>

              <View className="bg-resolve-panel border border-resolve-border rounded-xs p-2.5">
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-resolve-muted text-[10px] font-mono">FILE PATH:</Text>
                  <Text className="text-resolve-text text-[10px] font-mono max-w-[65%]" numberOfLines={1}>
                    {item.path || '/internal/stream/output.mp4'}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-resolve-muted text-[10px] font-mono">TIMECODE (DUR):</Text>
                  <Text className="text-resolve-text text-[10px] font-mono">
                    {item.duration || '00:00:30'}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-resolve-muted text-[10px] font-mono">MUXED TAKES:</Text>
                  <Text className="text-resolve-text text-[10px] font-mono">
                    {item.takesCount || '1'} TAKES
                  </Text>
                </View>

                <TouchableOpacity
                  className="flex-row items-center justify-center gap-1.5 mt-2.5 py-1.5 border border-resolve-crimson/50 bg-resolve-crimson/15 rounded-xs active:bg-resolve-crimson/30"
                  onPress={() => confirmDeleteVideo(item.id, item.title)}
                >
                  <Trash2 size={12} color="#C73B3B" />
                  <Text className="text-resolve-crimson font-mono text-[10px] font-bold uppercase">
                    DELETE VIDEO FILE
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      );
    }

    // ------------------------------------------------------------------
    // SCRIPT ITEM
    // ------------------------------------------------------------------
    return (
      <View className="bg-resolve-panel border border-resolve-border rounded-xs mb-2.5 overflow-hidden">
        {/* PRIMARY ROW (Always visible) */}
        <View className="p-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5 flex-1 mr-3">
            <View className="w-8 h-8 bg-resolve-recessed border border-resolve-border rounded-xs items-center justify-center">
              <FileText size={15} color="#DEDEDE" />
            </View>
            <View className="flex-1">
              <Text className="text-resolve-text font-mono text-xs font-bold" numberOfLines={1}>
                {item.title}
              </Text>
              <Text className="text-resolve-muted font-mono text-[10px] mt-0.5">
                {item.beats?.length || 0} takes • Est. {item.targetDuration || '1 min'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              className={`p-1.5 rounded-xs border ${isExpanded ? 'bg-resolve-accent border-resolve-accent' : 'bg-resolve-recessed border-resolve-border'} active:opacity-80`}
              onPress={() => toggleExpand(item.id)}
              activeOpacity={0.7}
            >
              <Info size={13} color={isExpanded ? '#000000' : '#888888'} />
            </TouchableOpacity>

            <TouchableOpacity
              className="p-1.5 bg-resolve-recessed border border-resolve-border rounded-xs active:bg-resolve-crimson/20"
              onPress={() => confirmDeleteScript(item.id, item.title)}
              activeOpacity={0.7}
            >
              <Trash2 size={13} color="#888888" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center gap-1.5 bg-resolve-crimson px-3 py-1.5 rounded-xs border border-resolve-crimsonDark active:opacity-90"
              onPress={() => handleSelectScriptToRecord(item)}
              activeOpacity={0.8}
            >
              <Video size={11} color="#FFFFFF" />
              <Text className="text-white text-[10px] font-bold uppercase tracking-wider font-mono">
                ARM
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* INSPECTOR PANEL (Advanced details, hidden by default) */}
        {isExpanded && (
          <View className="bg-resolve-recessed border-t border-resolve-border p-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-resolve-muted font-mono text-[9px] font-bold tracking-wider uppercase">
                SCRIPT TIMELINE INSPECTOR
              </Text>
              <View className="bg-resolve-panel px-1.5 py-0.5 border border-resolve-border rounded-xs">
                <Text className="text-resolve-muted font-mono text-[9px] font-bold tracking-wider uppercase">
                  JSON SCRIPT
                </Text>
              </View>
            </View>

            <View className="bg-resolve-panel border border-resolve-border rounded-xs p-2.5">
              <View className="flex-row justify-between mb-1.5">
                <Text className="text-resolve-muted text-[10px] font-mono">CATEGORY:</Text>
                <Text className="text-resolve-text text-[10px] font-mono uppercase">
                  {item.category || 'PROJECT SCRIPT'}
                </Text>
              </View>
              <View className="flex-row justify-between mb-1.5">
                <Text className="text-resolve-muted text-[10px] font-mono">TARGET PACING:</Text>
                <Text className="text-resolve-text text-[10px] font-mono">
                  {item.defaultWpm || 150} WPM
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-resolve-muted text-[10px] font-mono">EST. TIMECODE:</Text>
                <Text className="text-resolve-text text-[10px] font-mono">
                  {item.targetDuration || '00:01:00'}
                </Text>
              </View>

              {item.beats && item.beats.length > 0 && (
                <View className="mt-1 pt-2 border-t border-resolve-border/60">
                  <Text className="text-resolve-muted font-mono text-[9px] font-bold uppercase mb-1">
                    BEAT SEQUENCE ({item.beats.length}):
                  </Text>
                  {item.beats.slice(0, 4).map((b, i) => (
                    <Text key={b.id || i} className="text-resolve-text font-mono text-[9px] py-0.5" numberOfLines={1}>
                      • {b.section}: {b.spokenText}
                    </Text>
                  ))}
                  {item.beats.length > 4 && (
                    <Text className="text-resolve-muted font-mono text-[8px] mt-0.5">
                      + {item.beats.length - 4} more takes...
                    </Text>
                  )}
                </View>
              )}

              <TouchableOpacity
                className="flex-row items-center justify-center gap-1.5 mt-2.5 py-1.5 border border-resolve-crimson/50 bg-resolve-crimson/15 rounded-xs active:bg-resolve-crimson/30"
                onPress={() => confirmDeleteScript(item.id, item.title)}
              >
                <Trash2 size={12} color="#C73B3B" />
                <Text className="text-resolve-crimson font-mono text-[10px] font-bold uppercase">
                  DELETE SCRIPT
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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

      {/* Top Header - STUDIO */}
      <View className="bg-resolve-header border-b border-resolve-border px-4 py-2.5 flex-row items-center justify-between z-30">

        {/* LEFT CORNER: Branding & Title */}
        <View className="flex-row items-center gap-2">
          <View className="w-2.5 h-2.5 bg-resolve-accent rounded-none" />
          <View>
            <Text className="text-resolve-text text-xs font-bold tracking-wider uppercase font-mono">
              STUDIO
            </Text>
            <Text className="text-resolve-muted text-[9px] tracking-tight uppercase font-mono">
              PROJECT WORKSPACE
            </Text>
          </View>
        </View>

        {/* RIGHT CORNER: Media Count */}
        <View className="flex-row items-center bg-resolve-recessed border border-resolve-border rounded-xs px-2.5 py-1.5">
          <FolderOpen size={11} color="#F26D21" />
          <Text className="text-[10px] font-bold uppercase tracking-wider text-resolve-text font-mono ml-1.5">
            ALL MEDIA ({displayedItems.length})
          </Text>
        </View>

      </View>

      {/* List */}
      <FlatList
        data={displayedItems}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12, paddingBottom: 95 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-20 px-6">
            <View className="w-12 h-12 bg-resolve-panel border border-resolve-border rounded-xs items-center justify-center mb-3">
              <Film size={22} color="#555555" />
            </View>
            <Text className="text-resolve-text text-xs font-bold uppercase tracking-wider font-mono mb-1">
              BIN EMPTY
            </Text>
            <Text className="text-resolve-muted text-[11px] font-mono text-center max-w-[240px]">
              No media or scripts in project workspace. Tap RECORD below or Import a JSON script.
            </Text>
          </View>
        }
      />

      {/* Bottom Sticky Action: RECORD */}
      <View className="absolute bottom-0 left-0 right-0 p-3 bg-resolve-header/95 border-t border-resolve-border">
        <TouchableOpacity
          className="flex-row items-center justify-center gap-2.5 bg-resolve-crimson border border-resolve-crimsonDark rounded-xs py-3 px-4 active:opacity-90 shadow-lg"
          activeOpacity={0.85}
          onPress={() => setIsRecordModalOpen(true)}
        >
          <View className="w-3 h-3 rounded-full bg-white" />
          <Text className="text-white text-xs font-bold uppercase tracking-wider font-mono">
            RECORD
          </Text>
        </TouchableOpacity>
      </View>

      {/* Record Mode Selector Overlay (Inline to avoid native Android Modal clash) */}
      {isRecordModalOpen && (
        <View className="absolute inset-0 bg-black/80 items-center justify-center p-4 z-50">
          <View className="bg-resolve-bg border border-resolve-border rounded-xs w-full max-w-[360px] overflow-hidden shadow-2xl">
            {/* Header */}
            <View className="flex-row justify-between items-center px-4 py-3 bg-resolve-header border-b border-resolve-border">
              <View className="flex-row items-center gap-2">
                <View className="w-2.5 h-2.5 rounded-full bg-resolve-crimson" />
                <Text className="text-resolve-text font-mono text-xs font-bold uppercase tracking-wider">
                  STUDIO // RECORDING SESSION
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsRecordModalOpen(false)} className="p-1 active:opacity-70">
                <X size={14} color="#888888" />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <View className="p-3 gap-2.5">
              {/* Option 1: Record With Script */}
              <TouchableOpacity
                className="p-3.5 bg-resolve-panel border border-resolve-border rounded-xs active:border-resolve-accent flex-row items-center gap-3"
                onPress={() => {
                  setIsRecordModalOpen(false);
                  onOpenScriptEditor('record');
                }}
                activeOpacity={0.75}
              >
                <View className="w-9 h-9 rounded-xs bg-resolve-recessed border border-resolve-border items-center justify-center">
                  <FileCode size={18} color="#F26D21" />
                </View>
                <View className="flex-1">
                  <Text className="text-resolve-text font-mono text-xs font-bold uppercase">
                    RECORD WITH SCRIPT
                  </Text>
                  <Text className="text-resolve-muted font-mono text-[10px] mt-0.5">
                    Arm prompter with JSON script & take-by-take recording
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 2: Record Without Script */}
              <TouchableOpacity
                className="p-3.5 bg-resolve-panel border border-resolve-border rounded-xs active:border-resolve-crimson flex-row items-center gap-3"
                onPress={() => {
                  setIsRecordModalOpen(false);
                  setFreeRecordingMode();
                  onStartNewRecording();
                }}
                activeOpacity={0.75}
              >
                <View className="w-9 h-9 rounded-xs bg-resolve-recessed border border-resolve-border items-center justify-center">
                  <Film size={18} color="#C73B3B" />
                </View>
                <View className="flex-1">
                  <Text className="text-resolve-text font-mono text-xs font-bold uppercase">
                    RECORD WITHOUT SCRIPT
                  </Text>
                  <Text className="text-resolve-muted font-mono text-[10px] mt-0.5">
                    Free-form video session without teleprompter text
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Cancel Footer */}
            <View className="p-3 bg-resolve-header border-t border-resolve-border">
              <TouchableOpacity
                className="w-full py-2 bg-resolve-recessed border border-resolve-border rounded-xs items-center active:bg-resolve-border"
                onPress={() => setIsRecordModalOpen(false)}
              >
                <Text className="text-resolve-text font-mono text-[10px] font-bold uppercase">
                  CANCEL
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}