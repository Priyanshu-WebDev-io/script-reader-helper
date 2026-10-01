import React, { useState, useEffect, useMemo } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Share,
  Alert
} from 'react-native';
import { 
  X, 
  FileText, 
  Check, 
  AlertTriangle, 
  Code, 
  Sparkles, 
  RotateCcw, 
  Eye,
  Share2,
  CheckCircle2,
  Minus,
  Plus
} from 'lucide-react-native';
import { 
  loadScriptFromInput, 
  getStarterJsonTemplate, 
  getLLMPromptTemplate 
} from '../utils/scriptLoaderEngine';

export function ScriptModal(props) {
  if (!props.visible) return null;
  return <ScriptModalInner {...props} />;
}

function ScriptModalInner({
  visible,
  onClose,
  currentScript,
  wpm = 150,
  onSaveScript,
  onWpmChange
}) {
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview' | 'prompt'
  const [scriptTitle, setScriptTitle] = useState(currentScript?.title || 'My Video Script');
  const [scriptInput, setScriptInput] = useState(
    currentScript?.rawText || getStarterJsonTemplate()
  );
  const [currentWpm, setCurrentWpm] = useState(wpm || 150);

  // Sync when currentScript changes
  useEffect(() => {
    if (currentScript?.rawText) {
      setScriptInput(currentScript.rawText);
      setScriptTitle(currentScript.title || 'My Video Script');
    }
    if (wpm) {
      setCurrentWpm(wpm);
    }
  }, [currentScript, wpm]);

  // Real-time evaluation via Script Loader Engine
  const parsedResult = useMemo(() => {
    return loadScriptFromInput(scriptInput, currentWpm);
  }, [scriptInput, currentWpm]);

  const isValid = parsedResult.success;
  const isJson = parsedResult.isJson;
  const script = parsedResult.script;
  const beats = script?.beats || [];
  const totalWords = script?.parsedInfo?.totalWords || 0;
  const totalDurationSec = script?.parsedInfo?.totalDurationSec || 0;

  // Auto-sync title if extracted from JSON
  useEffect(() => {
    if (isValid && script?.title && (!scriptTitle || scriptTitle === 'My Video Script')) {
      setScriptTitle(script.title);
    }
  }, [isValid, script]);

  const handleInsertTemplate = () => {
    const template = getStarterJsonTemplate();
    setScriptInput(template);
    setScriptTitle('Short Form Video Timeline');
  };

  const handleClear = () => {
    setScriptInput('');
    setScriptTitle('');
  };

  const handleSharePrompt = async () => {
    const promptText = getLLMPromptTemplate(
      scriptTitle || 'Create a viral 60-second video script',
      60,
      currentWpm
    );
    try {
      await Share.share({
        title: 'Resolve Studio LLM Script Prompt',
        message: promptText
      });
    } catch (e) {
      Alert.alert('Prompt Guide', promptText);
    }
  };

  const handleAdjustWpm = (delta) => {
    const nextWpm = Math.max(100, Math.min(220, currentWpm + delta));
    setCurrentWpm(nextWpm);
    if (onWpmChange) {
      onWpmChange(nextWpm);
    }
  };

  const handleSave = () => {
    if (!isValid) {
      Alert.alert('Invalid Script', parsedResult.error || 'Please correct the script format before saving.');
      return;
    }
    const finalTitle = scriptTitle.trim() || script.title || 'Untitled Script';
    onSaveScript(scriptInput, finalTitle);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/85 justify-center p-3">
        <View className="bg-resolve-bg border border-resolve-border rounded-xs max-h-[92%] overflow-hidden flex-col">
          
          {/* DaVinci Resolve Inspector Header */}
          <View className="flex-row justify-between items-center px-4 py-2.5 bg-resolve-header border-b border-resolve-border">
            <View className="flex-row items-center gap-2">
              <View className="w-5 h-5 bg-resolve-panel border border-resolve-border rounded-xs items-center justify-center">
                <FileText size={11} color="#F26D21" />
              </View>
              <View>
                <Text className="text-resolve-text text-xs font-bold uppercase tracking-wider font-mono">
                  SCRIPT INSPECTOR // LOADER ENGINE
                </Text>
                <Text className="text-resolve-muted text-[10px] tracking-tight">
                  JSON Schema & Tagged Text Parser
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1 active:bg-resolve-panel" activeOpacity={0.7}>
              <X size={16} color="#888888" />
            </TouchableOpacity>
          </View>

          {/* Validation Status Banner */}
          <View className={`flex-row items-center justify-between px-3 py-1.5 border-b border-resolve-border ${
            isValid ? 'bg-resolve-recessed' : 'bg-resolve-crimson/20'
          }`}>
            <View className="flex-row items-center gap-2 flex-1 mr-2">
              {isValid ? (
                <CheckCircle2 size={13} color="#F26D21" />
              ) : (
                <AlertTriangle size={13} color="#C73B3B" />
              )}
              <Text className={`font-mono text-[10px] font-bold uppercase ${
                isValid ? 'text-resolve-text' : 'text-resolve-crimson'
              }`} numberOfLines={1}>
                {isValid
                  ? (isJson ? 'JSON SCHEMA VALIDATED // READY' : 'TAGGED TEXT VALIDATED // READY')
                  : (parsedResult.error || 'Syntax error in script input')}
              </Text>
            </View>
            <View className="bg-resolve-panel px-1.5 py-0.5 border border-resolve-border rounded-none">
              <Text className="text-resolve-muted font-mono text-[9px] font-bold">
                {isJson ? 'JSON' : 'MD'}
              </Text>
            </View>
          </View>

          {/* Quick Action Toolbar */}
          <View className="flex-row items-center gap-2 px-3 py-2 bg-resolve-header border-b border-resolve-border">
            <TouchableOpacity 
              className="flex-row items-center gap-1.5 bg-resolve-panel border border-resolve-border px-2.5 py-1 rounded-xs active:bg-resolve-border" 
              onPress={handleInsertTemplate}
              activeOpacity={0.8}
            >
              <Code size={11} color="#DEDEDE" />
              <Text className="text-resolve-text font-mono text-[10px] uppercase font-bold">
                INSERT JSON SCHEMA
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center gap-1.5 bg-resolve-panel border border-resolve-border px-2.5 py-1 rounded-xs active:bg-resolve-border" 
              onPress={handleSharePrompt}
              activeOpacity={0.8}
            >
              <Share2 size={11} color="#F26D21" />
              <Text className="text-resolve-accent font-mono text-[10px] uppercase font-bold">
                AI PROMPT
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center gap-1 bg-resolve-recessed border border-resolve-border px-2 py-1 rounded-xs ml-auto active:bg-resolve-panel" 
              onPress={handleClear}
              activeOpacity={0.8}
            >
              <RotateCcw size={10} color="#888888" />
              <Text className="text-resolve-muted font-mono text-[10px] uppercase">
                CLEAR
              </Text>
            </TouchableOpacity>
          </View>

          {/* Meta & Configuration Bar (Title + WPM) */}
          <View className="flex-row gap-3 px-3 py-2 bg-resolve-bg border-b border-resolve-border">
            <View className="flex-1">
              <Text className="text-resolve-muted font-mono text-[9px] font-bold uppercase mb-1">
                SCRIPT TITLE
              </Text>
              <TextInput
                className="bg-resolve-recessed text-resolve-text border border-resolve-border rounded-xs px-2.5 py-1.5 text-xs font-mono"
                value={scriptTitle}
                onChangeText={setScriptTitle}
                placeholder="Script Title..."
                placeholderTextColor="#555555"
              />
            </View>

            <View className="w-28">
              <Text className="text-resolve-muted font-mono text-[9px] font-bold uppercase mb-1">
                TARGET PACE
              </Text>
              <View className="flex-row items-center justify-between bg-resolve-recessed border border-resolve-border rounded-xs px-1 py-1">
                <TouchableOpacity 
                  className="w-5 h-5 bg-resolve-panel border border-resolve-border rounded-none items-center justify-center active:bg-resolve-border" 
                  onPress={() => handleAdjustWpm(-10)}
                  activeOpacity={0.7}
                >
                  <Minus size={10} color="#DEDEDE" />
                </TouchableOpacity>
                <Text className="text-resolve-text font-mono text-[10px] font-bold">
                  {currentWpm} WPM
                </Text>
                <TouchableOpacity 
                  className="w-5 h-5 bg-resolve-panel border border-resolve-border rounded-none items-center justify-center active:bg-resolve-border" 
                  onPress={() => handleAdjustWpm(10)}
                  activeOpacity={0.7}
                >
                  <Plus size={10} color="#DEDEDE" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* NLE Tabs: Editor vs Beats Breakdown */}
          <View className="flex-row bg-resolve-recessed border-b border-resolve-border">
            <TouchableOpacity
              className={`flex-1 py-2 flex-row items-center justify-center gap-1.5 border-b-2 ${
                activeTab === 'editor' 
                  ? 'bg-resolve-panel border-resolve-accent' 
                  : 'border-transparent'
              }`}
              onPress={() => setActiveTab('editor')}
              activeOpacity={0.8}
            >
              <FileText size={11} color={activeTab === 'editor' ? '#F26D21' : '#888888'} />
              <Text className={`font-mono text-[10px] font-bold uppercase ${
                activeTab === 'editor' ? 'text-resolve-text' : 'text-resolve-muted'
              }`}>
                CODE INPUT
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-2 flex-row items-center justify-center gap-1.5 border-b-2 ${
                activeTab === 'preview' 
                  ? 'bg-resolve-panel border-resolve-accent' 
                  : 'border-transparent'
              }`}
              onPress={() => setActiveTab('preview')}
              activeOpacity={0.8}
            >
              <Eye size={11} color={activeTab === 'preview' ? '#F26D21' : '#888888'} />
              <Text className={`font-mono text-[10px] font-bold uppercase ${
                activeTab === 'preview' ? 'text-resolve-text' : 'text-resolve-muted'
              }`}>
                TRACK BEATS ({beats.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-2 flex-row items-center justify-center gap-1.5 border-b-2 ${
                activeTab === 'prompt' 
                  ? 'bg-resolve-panel border-resolve-accent' 
                  : 'border-transparent'
              }`}
              onPress={() => setActiveTab('prompt')}
              activeOpacity={0.8}
            >
              <Sparkles size={11} color={activeTab === 'prompt' ? '#F26D21' : '#888888'} />
              <Text className={`font-mono text-[10px] font-bold uppercase ${
                activeTab === 'prompt' ? 'text-resolve-text' : 'text-resolve-muted'
              }`}>
                LLM SPEC
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main Body */}
          <View className="h-64 bg-resolve-recessed">
            {activeTab === 'editor' && (
              <View className="flex-1 p-2">
                <TextInput
                  className="flex-1 bg-resolve-bg text-resolve-text border border-resolve-border rounded-xs p-2.5 font-mono text-[11px] leading-4"
                  multiline
                  value={scriptInput}
                  onChangeText={setScriptInput}
                  placeholder={`Paste LLM JSON output here:\n{\n  "title": "Title",\n  "beats": [\n    {\n      "section": "HOOK",\n      "spokenText": "...",\n      "tone": "hook",\n      "pauseAfterSec": 1.2\n    }\n  ]\n}`}
                  placeholderTextColor="#444444"
                  textAlignVertical="top"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            {activeTab === 'preview' && (
              <ScrollView className="flex-1 p-2" showsVerticalScrollIndicator={false}>
                {beats.length === 0 ? (
                  <View className="items-center justify-center py-10 px-4">
                    <AlertTriangle size={24} color="#555555" />
                    <Text className="text-resolve-text font-mono text-xs font-bold mt-2">
                      NO BEATS DETECTED
                    </Text>
                    <Text className="text-resolve-muted font-mono text-[10px] text-center mt-1 max-w-[200px]">
                      Enter valid JSON or tagged text to inspect parsed track beats.
                    </Text>
                  </View>
                ) : (
                  beats.map((beat, idx) => (
                    <View key={beat.id || idx} className="bg-resolve-panel border border-resolve-border rounded-xs p-2.5 mb-2">
                      <View className="flex-row items-center justify-between pb-1.5 mb-1.5 border-b border-resolve-border/60">
                        <View className="flex-row items-center gap-1.5">
                          <View className="bg-resolve-accent px-1.5 py-0.5 rounded-none">
                            <Text className="text-black font-mono text-[9px] font-bold">
                              TAKE {idx + 1}
                            </Text>
                          </View>
                          <Text className="text-resolve-text font-mono text-[11px] font-bold uppercase">
                            {beat.section}
                          </Text>
                        </View>
                        <View className="bg-resolve-recessed px-1.5 py-0.5 border border-resolve-border rounded-none">
                          <Text className="text-resolve-muted font-mono text-[9px] uppercase">
                            TONE: {beat.tone?.label || beat.tone || 'NATURAL'}
                          </Text>
                        </View>
                      </View>

                      {beat.stageCues && (
                        <View className="bg-resolve-recessed px-2 py-1 rounded-none border-l-2 border-resolve-accent mb-2">
                          <Text className="text-resolve-muted font-mono text-[10px] uppercase">
                            👁 {beat.stageCues}
                          </Text>
                        </View>
                      )}

                      <Text className="text-resolve-text text-xs leading-5 mb-2">
                        {beat.spokenText}
                      </Text>

                      <View className="pt-1.5 border-t border-resolve-border/40 flex-row items-center justify-between">
                        <Text className="text-resolve-muted font-mono text-[9px]">
                          {beat.wordCount} words • ~{beat.speakingDurationSec}s • {beat.pauseAfterSec}s pause
                        </Text>
                        {beat.emphasisWords && beat.emphasisWords.length > 0 && (
                          <View className="flex-row gap-1">
                            {beat.emphasisWords.map((word, wIdx) => (
                              <View key={wIdx} className="bg-resolve-recessed border border-resolve-border px-1 rounded-none">
                                <Text className="text-resolve-accent font-mono text-[8px] font-bold">
                                  {word}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            )}

            {activeTab === 'prompt' && (
              <ScrollView className="flex-1 p-2" showsVerticalScrollIndicator={false}>
                <View className="bg-resolve-panel border border-resolve-border rounded-xs p-3">
                  <Text className="text-resolve-text font-mono text-xs font-bold uppercase mb-1">
                    UNIVERSAL LLM PROMPT SPECIFICATION
                  </Text>
                  <Text className="text-resolve-muted text-[10px] mb-2 font-mono">
                    Paste this into ChatGPT, Claude, Gemini, or DeepSeek:
                  </Text>

                  <View className="bg-resolve-recessed border border-resolve-border rounded-none p-2 mb-3">
                    <Text className="text-resolve-text font-mono text-[10px] leading-4" selectable>
                      {getLLMPromptTemplate(scriptTitle || 'Your Topic Here', 60, currentWpm)}
                    </Text>
                  </View>

                  <TouchableOpacity 
                    className="flex-row items-center justify-center gap-1.5 bg-resolve-accent border border-resolve-accent py-2 rounded-xs active:opacity-90" 
                    onPress={handleSharePrompt}
                    activeOpacity={0.85}
                  >
                    <Share2 size={13} color="#000000" />
                    <Text className="text-black font-mono text-xs font-bold uppercase tracking-wider">
                      SHARE / COPY PROMPT
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>

          {/* Stats Bar */}
          <View className="flex-row justify-between px-4 py-2 bg-resolve-header border-t border-b border-resolve-border">
            <View className="items-center">
              <Text className="text-resolve-muted font-mono text-[9px] font-bold uppercase">BEATS</Text>
              <Text className="text-resolve-text font-mono text-xs font-bold">{beats.length}</Text>
            </View>
            <View className="items-center">
              <Text className="text-resolve-muted font-mono text-[9px] font-bold uppercase">WORDS</Text>
              <Text className="text-resolve-text font-mono text-xs font-bold">{totalWords}</Text>
            </View>
            <View className="items-center">
              <Text className="text-resolve-muted font-mono text-[9px] font-bold uppercase">EST. DURATION</Text>
              <Text className="text-resolve-text font-mono text-xs font-bold">~{totalDurationSec}s</Text>
            </View>
            <View className="items-center">
              <Text className="text-resolve-muted font-mono text-[9px] font-bold uppercase">TIMELINE PACE</Text>
              <Text className="text-resolve-text font-mono text-xs font-bold">{currentWpm} WPM</Text>
            </View>
          </View>

          {/* Modal Footer */}
          <View className="flex-row justify-end items-center gap-2.5 px-4 py-2.5 bg-resolve-bg">
            <TouchableOpacity 
              className="py-2 px-3 rounded-xs border border-resolve-border bg-resolve-panel active:bg-resolve-border" 
              onPress={onClose} 
              activeOpacity={0.8}
            >
              <Text className="text-resolve-muted font-mono text-[10px] font-bold uppercase">
                CANCEL
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className={`flex-row items-center gap-1.5 py-2 px-4 rounded-xs border ${
                (!isValid || beats.length === 0)
                  ? 'bg-resolve-panel border-resolve-border opacity-30'
                  : 'bg-resolve-accent border-resolve-accent active:opacity-90'
              }`}
              onPress={handleSave}
              disabled={!isValid || beats.length === 0}
              activeOpacity={0.85}
            >
              <Check size={13} color="#000000" />
              <Text className="text-black font-mono text-xs font-bold uppercase tracking-wider">
                LOAD TO TIMELINE ({beats.length} BEATS)
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}
