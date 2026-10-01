import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  NativeModules,
  PermissionsAndroid,
  Clipboard
} from 'react-native';
import {
  X,
  ChevronDown,
  ChevronUp,
  FileCode,
  Minus,
  Plus,
  Sliders,
  Check,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  Upload,
  FileUp,
  Copy,
  CopyCheck
} from 'lucide-react-native';
import {
  validateAndParseJsonScript,
  LLM_PROMPT_INSTRUCTIONS
} from '../utils/scriptLoaderEngine';

// Enable LayoutAnimation on Android for smooth UI transitions
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  onWpmChange,
  mode = 'import', // 'import' | 'record'
  onConfirmRecord
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const modalWidth = Math.min(windowWidth - 28, 520);
  const modalHeight = Math.min(windowHeight * 0.88, 660);

  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Content State
  const [scriptInput, setScriptInput] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [scriptTitle, setScriptTitle] = useState(currentScript?.title || '');
  const [currentWpm, setCurrentWpm] = useState(wpm || 150);
  const [isPicking, setIsPicking] = useState(false);

  const toggleInspector = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsInspectorOpen(!isInspectorOpen);
  };

  const handleCopyPrompt = () => {
    try {
      Clipboard.setString(LLM_PROMPT_INSTRUCTIONS);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCopied(true);
      setTimeout(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCopied(false);
      }, 3000);
    } catch (err) {
      Alert.alert('Clipboard Error', 'Could not copy instructions to clipboard.');
    }
  };

  // Request storage permissions if needed on Android
  const requestStoragePermissionIfNeeded = async () => {
    if (Platform.OS === 'android' && Platform.Version < 33) {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);
        return (
          granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.warn('Storage permission request error:', err);
      }
    }
    return true;
  };

  // Upload JSON File via native document picker
  const handleUploadFile = async () => {
    try {
      setIsPicking(true);
      await requestStoragePermissionIfNeeded();

      if (NativeModules.JsonPicker) {
        const result = await NativeModules.JsonPicker.pickJsonFile();
        if (result && result.content) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setScriptInput(result.content);
          setSelectedFileName(result.name || 'script.json');

          // Auto-name: use filename base unless user already typed a custom title
          const baseName = (result.name || '').replace(/\.json$/i, '');
          if (!scriptTitle || scriptTitle === 'Untitled Recording' || scriptTitle === 'Custom Script') {
            setScriptTitle(baseName);
          }
        }
      } else {
        Alert.alert('File Picker', 'Native file picker module is unavailable.');
      }
    } catch (err) {
      if (err.code !== 'E_CANCELLED') {
        Alert.alert('Upload Error', err.message || 'Could not load selected file.');
      }
    } finally {
      setIsPicking(false);
    }
  };

  // Real-time JSON Scanner & Schema Validator
  const scanResult = useMemo(() => {
    if (!scriptInput || !scriptInput.trim()) {
      return {
        valid: false,
        error: 'No JSON content loaded.',
        script: null,
        detectedTitle: '',
        beatsCount: 0,
        totalDurationSec: 0,
        totalWords: 0
      };
    }
    return validateAndParseJsonScript(scriptInput, currentWpm, scriptTitle);
  }, [scriptInput, currentWpm, scriptTitle]);

  const isValid = scanResult.valid;
  const script = scanResult.script;
  const beats = script?.beats || [];
  const totalDurationSec = scanResult.totalDurationSec;
  const totalWords = scanResult.totalWords;

  // Auto-fill title from JSON if available and title is currently empty
  useEffect(() => {
    if (isValid && scanResult.detectedTitle && !scriptTitle) {
      setScriptTitle(scanResult.detectedTitle);
    }
  }, [isValid, scanResult.detectedTitle, scriptTitle]);

  const handleAdjustWpm = (delta) => {
    const nextWpm = Math.max(100, Math.min(220, currentWpm + delta));
    setCurrentWpm(nextWpm);
    if (onWpmChange) onWpmChange(nextWpm);
  };

  const handleSaveAndConfirm = () => {
    if (!isValid) return;

    const finalTitle = scriptTitle.trim() || scanResult.detectedTitle || 'Untitled Script';

    if (onSaveScript) {
      onSaveScript(scriptInput, finalTitle);
    }

    if (mode === 'record' && onConfirmRecord) {
      onConfirmRecord(script);
    }

    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/85 items-center justify-center p-3">
        <View
          className="bg-resolve-bg border border-resolve-border rounded-xs overflow-hidden flex-col shadow-2xl"
          style={{ width: modalWidth, height: modalHeight }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-4 py-2.5 bg-resolve-header border-b border-resolve-border z-30">
            <View className="flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 bg-resolve-accent rounded-none" />
              <View>
                <Text className="text-resolve-text text-xs font-bold uppercase tracking-wider font-mono">
                  {mode === 'record' ? 'ARM RECORDING' : 'IMPORT MEDIA'}
                </Text>
                <Text className="text-resolve-muted text-[9px] tracking-tight font-mono uppercase">
                  JSON SCRIPT INGEST
                </Text>
              </View>
            </View>

            {/* Single Header Copy Button + Close */}
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={handleCopyPrompt}
                className={`px-2.5 py-1 rounded-xs border flex-row items-center gap-1.5 active:opacity-75 ${copied
                  ? 'bg-[#152418] border-[#22c55e]'
                  : 'bg-resolve-recessed border-resolve-border active:border-resolve-accent'
                  }`}
                activeOpacity={0.7}
              >
                {copied ? (
                  <>
                    <CopyCheck size={11} color="#4ade80" />
                    <Text className="text-[#4ade80] text-[9px] font-mono font-bold uppercase tracking-wider">
                      COPIED!
                    </Text>
                  </>
                ) : (
                  <>
                    <Copy size={11} color="#F26D21" />
                    <Text className="text-resolve-accent text-[9px] font-mono font-bold uppercase tracking-wider">
                      COPY LLM FORMAT
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} className="p-1 active:bg-resolve-recessed rounded-xs">
                <X size={16} color="#888888" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Unified Ingest Area: Upload Section + Paste Section */}
            <View className="p-3 bg-resolve-bg flex-1 gap-3.5">
              {/* Section 1: Upload JSON File */}
              <View>
                <View className="flex-row items-center gap-1.5 mb-2">
                  <Upload size={12} color="#F26D21" />
                  <Text className="text-resolve-text font-mono text-[10px] font-bold uppercase tracking-wider">
                    UPLOAD JSON FILE
                  </Text>
                </View>

                {/* Selected File Badge */}
                {selectedFileName ? (
                  <View className="bg-resolve-panel border border-resolve-accent rounded-xs p-3 mb-2 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2 flex-1 mr-2">
                      <FileCode size={16} color="#F26D21" />
                      <View className="flex-1">
                        <Text className="text-resolve-text font-mono text-xs font-bold" numberOfLines={1}>
                          {selectedFileName}
                        </Text>
                        <Text className="text-resolve-accent font-mono text-[9px] uppercase tracking-wider mt-0.5">
                          {isValid ? `✓ READY • ${beats.length} TAKES LOADED` : 'SCANNING FILE...'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      className="bg-resolve-recessed border border-resolve-border px-2.5 py-1 rounded-xs"
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setSelectedFileName('');
                        setScriptInput('');
                      }}
                    >
                      <Text className="text-resolve-muted font-mono text-[9px] uppercase font-bold">CLEAR</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Clean Upload Button */}
                <TouchableOpacity
                  className="border-2 border-dashed border-resolve-border rounded-xs p-5 items-center justify-center bg-resolve-panel/60 active:border-resolve-accent active:bg-resolve-panel"
                  onPress={handleUploadFile}
                  disabled={isPicking}
                  activeOpacity={0.8}
                >
                  <View className="w-10 h-10 rounded-xs bg-resolve-recessed border border-resolve-border items-center justify-center mb-2">
                    {isPicking ? (
                      <ActivityIndicator size={18} color="#F26D21" />
                    ) : (
                      <FileUp size={20} color="#F26D21" />
                    )}
                  </View>
                  <Text className="text-resolve-text font-mono text-xs font-bold uppercase tracking-wider mb-0.5">
                    {isPicking ? 'OPENING FILE PICKER...' : 'SELECT .JSON SCRIPT'}
                  </Text>
                  <Text className="text-resolve-muted font-mono text-[9px] text-center max-w-[260px]">
                    Choose a structured .json script file from your device storage.
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Divider with OR */}
              <View className="flex-row items-center gap-2 my-0.5">
                <View className="h-px bg-resolve-border flex-1" />
                <Text className="text-resolve-muted font-mono text-[9px] uppercase font-bold tracking-wider">
                  OR PASTE CONTENT
                </Text>
                <View className="h-px bg-resolve-border flex-1" />
              </View>

              {/* Section 2: Paste Content */}
              <View>
                <View className="flex-row items-center gap-1.5 mb-2">
                  <FileCode size={12} color="#F26D21" />
                  <Text className="text-resolve-text font-mono text-[10px] font-bold uppercase tracking-wider">
                    PASTE JSON SCRIPT
                  </Text>
                </View>

                {/* Pasted content badge */}
                {scriptInput && !selectedFileName ? (
                  <View className="bg-resolve-panel border border-resolve-accent rounded-xs p-3 mb-2 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2 flex-1 mr-2">
                      <FileCode size={16} color="#F26D21" />
                      <View className="flex-1">
                        <Text className="text-resolve-text font-mono text-xs font-bold" numberOfLines={1}>
                          Clipboard Content
                        </Text>
                        <Text className="text-resolve-accent font-mono text-[9px] uppercase tracking-wider mt-0.5">
                          {isValid ? `✓ READY • ${beats.length} TAKES LOADED` : 'SCANNING...'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      className="bg-resolve-recessed border border-resolve-border px-2.5 py-1 rounded-xs"
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setScriptInput('');
                      }}
                    >
                      <Text className="text-resolve-muted font-mono text-[9px] uppercase font-bold">CLEAR</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Paste Button */}
                <TouchableOpacity
                  className="border-2 border-dashed border-resolve-border rounded-xs p-5 items-center justify-center bg-resolve-panel/60 active:border-resolve-accent active:bg-resolve-panel"
                  onPress={async () => {
                    try {
                      const text = await Clipboard.getString();
                      if (!text || !text.trim()) {
                        Alert.alert('Clipboard Empty', 'Nothing found in clipboard. Copy your JSON script first.');
                        return;
                      }
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setScriptInput(text);
                      setSelectedFileName('');
                    } catch (err) {
                      Alert.alert('Clipboard Error', 'Could not read from clipboard.');
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <View className="w-10 h-10 rounded-xs bg-resolve-recessed border border-resolve-border items-center justify-center mb-2">
                    <FileCode size={20} color="#F26D21" />
                  </View>
                  <Text className="text-resolve-text font-mono text-xs font-bold uppercase tracking-wider mb-0.5">
                    PASTE FROM CLIPBOARD
                  </Text>
                  <Text className="text-resolve-muted font-mono text-[9px] text-center max-w-[260px]">
                    Tap to paste your LLM-generated JSON script from clipboard.
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Real-time Scanner Status Banner */}
            <View className={`mx-3 mb-3 p-2.5 rounded-xs border ${!scriptInput.trim()
              ? 'bg-resolve-recessed border-resolve-border'
              : isValid
                ? 'bg-[#152418] border-[#22c55e]/60'
                : 'bg-[#291414] border-resolve-crimson/70'
              }`}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  {isValid ? (
                    <FileCheck2 size={13} color="#22c55e" />
                  ) : !scriptInput.trim() ? (
                    <View className="w-2 h-2 rounded-full bg-resolve-muted" />
                  ) : (
                    <AlertTriangle size={13} color="#C73B3B" />
                  )}
                  <Text className={`font-mono text-[10px] font-bold uppercase tracking-wider ${!scriptInput.trim()
                    ? 'text-resolve-muted'
                    : isValid
                      ? 'text-[#4ade80]'
                      : 'text-resolve-crimson'
                    }`}>
                    {!scriptInput.trim()
                      ? 'SCANNER STANDBY'
                      : isValid
                        ? '✓ VALID JSON SCRIPT'
                        : '✕ INVALID JSON SCRIPT'}
                  </Text>
                </View>
                {isValid && (
                  <Text className="text-resolve-text font-mono text-[9px] uppercase tracking-wider">
                    {beats.length} {beats.length === 1 ? 'TAKE' : 'TAKES'} • {totalWords} WDS
                  </Text>
                )}
              </View>
              {!isValid && scriptInput.trim() ? (
                <Text className="text-[#fca5a5] font-mono text-[10px] mt-1.5 leading-4">
                  {scanResult.error}
                </Text>
              ) : null}
            </View>

            {/* Step 2: Naming (Progressive Disclosure - Visible when Valid) */}
            {isValid && (
              <View className="mx-3 mb-3 bg-resolve-panel border border-resolve-accent/50 rounded-xs overflow-hidden">
                <View className="bg-resolve-accent/10 px-3 py-2 flex-row justify-between items-center border-b border-resolve-accent/30">
                  <Text className="text-resolve-accent font-mono text-[10px] font-bold uppercase tracking-wider">
                    SCRIPT METADATA
                  </Text>
                  <TouchableOpacity onPress={handleSaveAndConfirm} className="flex-row items-center gap-1 active:opacity-60">
                    <Text className="text-resolve-text font-mono text-[9px] uppercase">SKIP NAMING</Text>
                    <ArrowRight size={10} color="#DEDEDE" />
                  </TouchableOpacity>
                </View>
                <View className="p-3">
                  <Text className="text-resolve-muted font-mono text-[9px] uppercase mb-1.5">
                    SCRIPT NAME
                  </Text>
                  <TextInput
                    className="bg-resolve-recessed text-resolve-text border border-resolve-border rounded-xs px-2.5 py-2 text-xs font-mono"
                    value={scriptTitle}
                    onChangeText={setScriptTitle}
                    placeholder={scanResult.detectedTitle || "Name your script..."}
                    placeholderTextColor="#555555"
                  />
                  <Text className="text-resolve-muted font-mono text-[8px] mt-1.5">
                    Auto-detected from JSON schema. You can edit it or leave it as is.
                  </Text>
                </View>
              </View>
            )}

            {/* Timeline Inspector (Collapsible) */}
            {isValid && (
              <View className="mt-auto">
                <TouchableOpacity
                  onPress={toggleInspector}
                  activeOpacity={0.8}
                  className="flex-row justify-between items-center bg-resolve-panel border-t border-resolve-border px-4 py-2"
                >
                  <View className="flex-row items-center gap-1.5">
                    <Sliders size={11} color="#888888" />
                    <Text className="text-resolve-muted font-mono text-[10px] font-bold uppercase tracking-wider">
                      TIMELINE INSPECTOR
                    </Text>
                  </View>
                  {isInspectorOpen ? <ChevronUp size={14} color="#888888" /> : <ChevronDown size={14} color="#888888" />}
                </TouchableOpacity>

                {isInspectorOpen && (
                  <View className="bg-resolve-recessed border-t border-resolve-border p-3">
                    <View className="bg-resolve-panel border border-resolve-border rounded-xs p-2.5 mb-2.5 flex-row justify-between items-center">
                      <View>
                        <Text className="text-resolve-text font-mono text-[10px] font-bold uppercase">PACING CONTROL</Text>
                        <Text className="text-resolve-muted text-[9px] font-mono mt-0.5">EST. DUR: ~{totalDurationSec}s</Text>
                      </View>
                      <View className="flex-row items-center gap-1 bg-resolve-recessed border border-resolve-border rounded-xs px-1.5 py-0.5">
                        <TouchableOpacity className="p-1 active:opacity-60" onPress={() => handleAdjustWpm(-10)}>
                          <Minus size={11} color="#DEDEDE" />
                        </TouchableOpacity>
                        <Text className="text-resolve-accent font-mono text-xs font-bold w-8 text-center">{currentWpm}</Text>
                        <TouchableOpacity className="p-1 active:opacity-60" onPress={() => handleAdjustWpm(10)}>
                          <Plus size={11} color="#DEDEDE" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View className="flex-row justify-between items-center px-4 py-3 bg-resolve-header border-t border-resolve-border">
            <TouchableOpacity
              className="py-1.5 px-3 rounded-xs border border-resolve-border bg-resolve-recessed active:bg-resolve-border"
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text className="text-resolve-text font-mono text-[10px] font-bold uppercase">CANCEL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-row items-center gap-1.5 py-1.5 px-4 rounded-xs border ${!isValid
                ? 'bg-resolve-panel border-resolve-border opacity-50'
                : mode === 'record'
                  ? 'bg-resolve-crimson border-resolve-crimson active:opacity-80'
                  : 'bg-resolve-accent border-resolve-accent active:opacity-80'
                }`}
              onPress={handleSaveAndConfirm}
              disabled={!isValid}
              activeOpacity={0.85}
            >
              {mode === 'record' ? (
                <View className="w-2 h-2 rounded-full bg-white mr-0.5" />
              ) : (
                <Check size={12} color={!isValid ? '#888888' : '#000000'} />
              )}
              <Text className={`font-mono text-[10px] font-bold uppercase tracking-wider ${!isValid ? 'text-resolve-muted' : mode === 'record' ? 'text-white' : 'text-black'
                }`}>
                {mode === 'record' ? 'ARM & RECORD' : 'SAVE TO MEDIA POOL'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}