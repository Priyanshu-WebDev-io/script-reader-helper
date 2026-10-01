import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import {
  X,
  ChevronDown,
  ChevronUp,
  FileCode,
  RefreshCw,
  FolderOpen,
  Minus,
  Plus,
  Share2,
  HardDrive,
  Sliders,
  Check,
  Sparkles,
  FileCheck2,
  AlertTriangle
} from 'lucide-react-native';
import RNFS from 'react-native-fs';
import { validateAndParseJsonScript } from '../utils/scriptLoaderEngine';

// Enable LayoutAnimation on Android for smooth Inspector expansion
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

  // 'file' | 'paste'
  const [importMethod, setImportMethod] = useState('file');

  // Collapsible Inspector state
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const [scriptTitle, setScriptTitle] = useState(currentScript?.title || '');
  const [scriptInput, setScriptInput] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [currentWpm, setCurrentWpm] = useState(wpm || 150);

  // Device JSON files scanning
  const [deviceFiles, setDeviceFiles] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [manualPath, setManualPath] = useState('');

  const toggleInspector = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsInspectorOpen(!isInspectorOpen);
  };

  // Strictly scan for .json files only
  const scanDeviceFiles = async () => {
    setIsScanning(true);
    const searchDirs = [
      RNFS.DownloadDirectoryPath,
      RNFS.DocumentDirectoryPath,
      RNFS.ExternalStorageDirectoryPath ? `${RNFS.ExternalStorageDirectoryPath}/Download` : null
    ].filter(Boolean);

    const found = [];
    const seenPaths = new Set();

    for (const dir of searchDirs) {
      try {
        const exists = await RNFS.exists(dir);
        if (exists) {
          const items = await RNFS.readDir(dir);
          for (const item of items) {
            if (item.isFile() && !seenPaths.has(item.path)) {
              const lowerName = item.name.toLowerCase();
              if (lowerName.endsWith('.json')) {
                seenPaths.add(item.path);
                found.push({
                  name: item.name,
                  path: item.path,
                  size: item.size
                });
              }
            }
          }
        }
      } catch (e) {
        // directory access restricted or unavailable
      }
    }

    setDeviceFiles(found);
    setIsScanning(false);
  };

  useEffect(() => {
    scanDeviceFiles();
  }, []);

  const handleSelectFile = async (filePath, fileName) => {
    try {
      const content = await RNFS.readFile(filePath, 'utf8');
      setScriptInput(content);
      const cleanFileName = fileName || filePath.split('/').pop();
      setSelectedFileName(cleanFileName);

      // Auto-name: use filename base unless user already typed a custom title
      const baseName = cleanFileName.replace(/\.json$/i, '');
      if (!scriptTitle || scriptTitle === 'Custom Script') {
        setScriptTitle(baseName);
      }
    } catch (e) {
      Alert.alert('Read Error', `Unable to read JSON file: ${e.message}`);
    }
  };

  // Real-time JSON Scanner & Schema Validator
  const scanResult = useMemo(() => {
    if (!scriptInput || !scriptInput.trim()) {
      return {
        valid: false,
        error: 'No JSON content loaded.',
        errors: [],
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
    if (scanResult.detectedTitle && !scriptTitle) {
      setScriptTitle(scanResult.detectedTitle);
    }
  }, [scanResult.detectedTitle, scriptTitle]);

  const handleAdjustWpm = (delta) => {
    const nextWpm = Math.max(100, Math.min(220, currentWpm + delta));
    setCurrentWpm(nextWpm);
    if (onWpmChange) onWpmChange(nextWpm);
  };

  const handleSaveAndConfirm = () => {
    if (!isValid) {
      Alert.alert('Invalid Script', scanResult.error || 'Please provide a valid JSON script.');
      return;
    }

    const finalTitle = (scriptTitle.trim() || scanResult.detectedTitle || 'Custom Script').trim();

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
      <View className="flex-1 bg-black/80 items-center justify-center p-3">
        <View
          className="bg-resolve-bg border border-resolve-border rounded-xs overflow-hidden flex-col shadow-2xl"
          style={{ width: modalWidth, height: modalHeight }}
        >

          {/* STUDIO Header */}
          <View className="flex-row justify-between items-center px-4 py-2.5 bg-resolve-header border-b border-resolve-border z-30">
            <View className="flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 bg-resolve-accent rounded-none" />
              <View>
                <Text className="text-resolve-text text-xs font-bold uppercase tracking-wider font-mono">
                  STUDIO // IMPORT SCRIPT
                </Text>
                <Text className="text-resolve-muted text-[9px] tracking-tight font-mono uppercase">
                  JSON MEDIA INGEST & SCANNER
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              className="p-1 bg-resolve-recessed border border-resolve-border rounded-xs active:opacity-70"
            >
              <X size={14} color="#888888" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Script Name & Auto-Name Option */}
            <View className="px-4 py-2.5 bg-resolve-bg border-b border-resolve-border">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-resolve-muted font-mono text-[9px] font-bold uppercase">
                  SCRIPT NAME
                </Text>
                {scanResult.detectedTitle && scriptTitle !== scanResult.detectedTitle && (
                  <TouchableOpacity
                    onPress={() => setScriptTitle(scanResult.detectedTitle)}
                    className="flex-row items-center gap-1 active:opacity-70"
                  >
                    <Sparkles size={10} color="#F26D21" />
                    <Text className="text-resolve-accent font-mono text-[9px] uppercase font-bold">
                      USE DETECTED TITLE
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                className="bg-resolve-recessed text-resolve-text border border-resolve-border rounded-xs px-2.5 py-1.5 text-xs font-mono"
                value={scriptTitle}
                onChangeText={setScriptTitle}
                placeholder={scanResult.detectedTitle || "Name your script..."}
                placeholderTextColor="#555555"
              />
            </View>

            {/* Input Format Selector: Only JSON File (.json) or JSON Text */}
            <View className="flex-row bg-resolve-recessed border-b border-resolve-border px-2">
              <TouchableOpacity
                className={`px-4 py-2 border-b-2 flex-row items-center gap-1.5 ${importMethod === 'file' ? 'border-resolve-accent bg-resolve-panel' : 'border-transparent'
                  }`}
                onPress={() => setImportMethod('file')}
              >
                <HardDrive size={11} color={importMethod === 'file' ? '#F26D21' : '#888888'} />
                <Text className={`text-[10px] font-bold uppercase tracking-wider font-mono ${importMethod === 'file' ? 'text-resolve-text' : 'text-resolve-muted'
                  }`}>
                  JSON FILE (.JSON)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`px-4 py-2 border-b-2 flex-row items-center gap-1.5 ${importMethod === 'paste' ? 'border-resolve-accent bg-resolve-panel' : 'border-transparent'
                  }`}
                onPress={() => setImportMethod('paste')}
              >
                <FileCode size={11} color={importMethod === 'paste' ? '#F26D21' : '#888888'} />
                <Text className={`text-[10px] font-bold uppercase tracking-wider font-mono ${importMethod === 'paste' ? 'text-resolve-text' : 'text-resolve-muted'
                  }`}>
                  PASTE JSON TEXT
                </Text>
              </TouchableOpacity>
            </View>

            {/* Source Content Area */}
            <View className="p-3 bg-resolve-bg">
              {importMethod === 'file' ? (
                <View>
                  {/* Selected File Badge */}
                  {selectedFileName ? (
                    <View className="bg-resolve-panel border border-resolve-accent rounded-xs p-2.5 mb-2.5 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2 flex-1 mr-2">
                        <FileCode size={14} color="#F26D21" />
                        <View className="flex-1">
                          <Text className="text-resolve-text font-mono text-xs font-bold" numberOfLines={1}>
                            {selectedFileName}
                          </Text>
                          <Text className="text-resolve-accent font-mono text-[9px] uppercase tracking-wider mt-0.5">
                            {isValid ? `LOADED • ${beats.length} BEATS` : 'SCANNING JSON FILE...'}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        className="bg-resolve-recessed border border-resolve-border px-2 py-1 rounded-xs"
                        onPress={() => {
                          setSelectedFileName('');
                          setScriptInput('');
                        }}
                      >
                        <Text className="text-resolve-muted font-mono text-[9px] uppercase font-bold">CLEAR</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {/* Device JSON Files Header */}
                  <View className="flex-row items-center justify-between mb-2 px-1">
                    <Text className="text-resolve-muted font-mono text-[9px] font-bold uppercase">
                      DETECTED JSON FILES ({deviceFiles.length})
                    </Text>
                    <TouchableOpacity
                      className="flex-row items-center gap-1 bg-resolve-recessed border border-resolve-border px-1.5 py-0.5 rounded-xs"
                      onPress={scanDeviceFiles}
                      disabled={isScanning}
                    >
                      {isScanning ? (
                        <ActivityIndicator size={10} color="#888888" />
                      ) : (
                        <RefreshCw size={10} color="#888888" />
                      )}
                      <Text className="text-resolve-text font-mono text-[9px] uppercase font-bold">RESCAN</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Scanned JSON Files List */}
                  <ScrollView className="max-h-40 mb-2" showsVerticalScrollIndicator={false}>
                    {deviceFiles.length === 0 ? (
                      <View className="bg-resolve-recessed border border-resolve-border rounded-xs p-4 items-center justify-center">
                        <FolderOpen size={16} color="#555555" />
                        <Text className="text-resolve-muted font-mono text-[10px] mt-1.5 text-center">
                          No .json files found in Downloads/Documents.
                        </Text>
                        <Text className="text-resolve-dim font-mono text-[9px] text-center mt-0.5">
                          Paste JSON directly or use path override below.
                        </Text>
                      </View>
                    ) : (
                      deviceFiles.map((file, idx) => (
                        <TouchableOpacity
                          key={file.path || idx}
                          className={`flex-row items-center justify-between p-2 mb-1.5 rounded-xs border ${selectedFileName === file.name
                            ? 'bg-resolve-panel border-resolve-accent'
                            : 'bg-resolve-panel border-resolve-border active:bg-resolve-recessed'
                            }`}
                          onPress={() => handleSelectFile(file.path, file.name)}
                          activeOpacity={0.7}
                        >
                          <View className="flex-row items-center gap-2 flex-1 mr-2">
                            <FileCode size={12} color={selectedFileName === file.name ? '#F26D21' : '#888888'} />
                            <View className="flex-1">
                              <Text className="text-resolve-text font-mono text-[11px] font-bold" numberOfLines={1}>
                                {file.name}
                              </Text>
                              <Text className="text-resolve-muted font-mono text-[9px]">
                                {Math.round((file.size || 0) / 1024)} KB • JSON
                              </Text>
                            </View>
                          </View>
                          {selectedFileName === file.name && (
                            <Text className="text-resolve-accent font-mono text-[9px] font-bold uppercase">SELECTED</Text>
                          )}
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>

                  {/* Manual Path Override for .json */}
                  <View className="bg-resolve-panel border border-resolve-border rounded-xs p-2 flex-row items-center gap-2">
                    <TextInput
                      className="flex-1 bg-resolve-recessed text-resolve-text border border-resolve-border rounded-xs px-2 py-1 text-[10px] font-mono"
                      value={manualPath}
                      onChangeText={setManualPath}
                      placeholder="/sdcard/Download/script.json"
                      placeholderTextColor="#555555"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      className="bg-resolve-recessed border border-resolve-border px-2.5 py-1 rounded-xs active:bg-resolve-border"
                      onPress={() => {
                        if (manualPath.trim()) handleSelectFile(manualPath.trim(), manualPath.trim().split('/').pop());
                      }}
                    >
                      <Text className="text-resolve-text font-mono text-[9px] font-bold uppercase">LOAD</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* Paste JSON Text Area */
                <View>
                  <TextInput
                    className="w-full bg-resolve-recessed text-resolve-text border border-resolve-border rounded-xs p-2.5 font-mono text-xs leading-5 min-h-[140px] max-h-[180px]"
                    multiline
                    value={scriptInput}
                    onChangeText={setScriptInput}
                    placeholder={`{\n  "title": "My Video Script",\n  "beats": [\n    {\n      "section": "HOOK",\n      "spokenText": "Did you know this one camera technique?"\n    }\n  ]\n}`}
                    placeholderTextColor="#444444"
                    textAlignVertical="top"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}
            </View>

            {/* =========================================================
                REAL-TIME SCAN & VALIDATION STATUS BANNER
            ========================================================= */}
            <View className={`mx-3 mb-3 p-3 rounded-xs border ${
              !scriptInput.trim()
                ? 'bg-resolve-recessed border-resolve-border'
                : isValid
                  ? 'bg-[#152418] border-[#22c55e]/60'
                  : 'bg-[#291414] border-resolve-crimson/70'
            }`}>
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center gap-1.5">
                  {isValid ? (
                    <FileCheck2 size={13} color="#22c55e" />
                  ) : !scriptInput.trim() ? (
                    <View className="w-2 h-2 rounded-full bg-resolve-muted" />
                  ) : (
                    <AlertTriangle size={13} color="#C73B3B" />
                  )}
                  <Text className={`font-mono text-[10px] font-bold uppercase tracking-wider ${
                    !scriptInput.trim()
                      ? 'text-resolve-muted'
                      : isValid
                        ? 'text-[#4ade80]'
                        : 'text-resolve-crimson'
                  }`}>
                    {!scriptInput.trim()
                      ? 'JSON SCANNER STANDBY'
                      : isValid
                        ? '✓ VALID JSON SCRIPT'
                        : '✕ INVALID JSON SCRIPT'}
                  </Text>
                </View>
                {isValid && (
                  <Text className="text-resolve-text font-mono text-[9px] uppercase tracking-wider">
                    {beats.length} {beats.length === 1 ? 'TAKE' : 'TAKES'} • ~{totalDurationSec}s
                  </Text>
                )}
              </View>

              <Text className={`font-mono text-[10px] leading-4 ${
                !scriptInput.trim()
                  ? 'text-resolve-muted'
                  : isValid
                    ? 'text-resolve-text'
                    : 'text-[#fca5a5]'
              }`}>
                {!scriptInput.trim()
                  ? 'Select a .json file or paste JSON text to scan schema.'
                  : isValid
                    ? `Verified schema: ${beats.length} takes ready (${totalWords} words total).`
                    : scanResult.error}
              </Text>
            </View>

            {/* =========================================================
                ADVANCED INSPECTOR (Collapsible)
            ========================================================= */}
            <View className="mt-auto">
              <TouchableOpacity
                onPress={toggleInspector}
                activeOpacity={0.8}
                className="flex-row justify-between items-center bg-resolve-panel border-t border-resolve-border px-4 py-2"
              >
                <View className="flex-row items-center gap-1.5">
                  <Sliders size={11} color="#888888" />
                  <Text className="text-resolve-muted font-mono text-[10px] font-bold uppercase tracking-wider">
                    METADATA INSPECTOR & TIMELINE
                  </Text>
                </View>
                {isInspectorOpen ? <ChevronUp size={14} color="#888888" /> : <ChevronDown size={14} color="#888888" />}
              </TouchableOpacity>

              {isInspectorOpen && (
                <View className="bg-resolve-recessed border-t border-resolve-border p-3">
                  {/* Pacing Controller */}
                  <View className="bg-resolve-panel border border-resolve-border rounded-xs p-2.5 mb-2.5">
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text className="text-resolve-text font-mono text-[10px] font-bold uppercase">
                        PACING CONTROL
                      </Text>
                      <Text className="text-resolve-accent font-mono text-[10px] font-bold">
                        {currentWpm} WPM (~{totalDurationSec}s DUR)
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-resolve-muted text-[9px] font-mono">
                        Adjust reading speed for prompter auto-scroll
                      </Text>
                      <View className="flex-row items-center gap-1.5 bg-resolve-recessed border border-resolve-border rounded-xs px-2 py-1">
                        <TouchableOpacity className="p-0.5 active:opacity-60" onPress={() => handleAdjustWpm(-10)}>
                          <Minus size={11} color="#DEDEDE" />
                        </TouchableOpacity>
                        <Text className="text-resolve-text font-mono text-xs font-bold w-8 text-center">
                          {currentWpm}
                        </Text>
                        <TouchableOpacity className="p-0.5 active:opacity-60" onPress={() => handleAdjustWpm(10)}>
                          <Plus size={11} color="#DEDEDE" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Beat Breakdown Preview */}
                  {beats.length > 0 ? (
                    <View className="bg-resolve-panel border border-resolve-border rounded-xs p-2 max-h-32">
                      <Text className="text-resolve-muted font-mono text-[9px] font-bold uppercase mb-1.5">
                        TAKETIME BREAKDOWN ({beats.length} TAKES)
                      </Text>
                      <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                        {beats.map((beat, idx) => (
                          <View key={beat.id || idx} className="flex-row justify-between items-center py-1 border-b border-resolve-border/50">
                            <Text className="text-resolve-accent font-mono text-[9px] font-bold w-16" numberOfLines={1}>
                              T{idx + 1}: {beat.section}
                            </Text>
                            <Text className="text-resolve-text font-mono text-[9px] flex-1 px-2" numberOfLines={1}>
                              {beat.spokenText}
                            </Text>
                            <Text className="text-resolve-muted font-mono text-[8px] w-12 text-right">
                              {beat.speakingDurationSec}s
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          </ScrollView>

          {/* STUDIO Footer */}
          <View className="flex-row justify-between items-center px-4 py-3 bg-resolve-header border-t border-resolve-border">
            <View className="flex-row items-center gap-1.5 flex-1 mr-2">
              {isValid && beats.length > 0 ? (
                <>
                  <View className="w-1.5 h-1.5 bg-[#22c55e] rounded-full" />
                  <Text className="text-resolve-text font-mono text-[10px] font-bold uppercase tracking-wider" numberOfLines={1}>
                    {scriptTitle.trim() || 'READY'} • {beats.length} {beats.length === 1 ? 'TAKE' : 'TAKES'}
                  </Text>
                </>
              ) : (
                <Text className="text-resolve-muted font-mono text-[10px] uppercase" numberOfLines={1}>
                  {scriptInput.trim() ? 'CANNOT IMPORT INVALID JSON' : 'AWAITING JSON INPUT'}
                </Text>
              )}
            </View>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                className="py-1.5 px-3 rounded-xs border border-resolve-border bg-resolve-recessed active:bg-resolve-border"
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text className="text-resolve-text font-mono text-[10px] font-bold uppercase">
                  CANCEL
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-row items-center gap-1.5 py-1.5 px-3 rounded-xs border ${(!isValid || beats.length === 0)
                  ? 'bg-resolve-panel border-resolve-border opacity-50'
                  : mode === 'record'
                    ? 'bg-resolve-crimson border-resolve-crimson active:opacity-80'
                    : 'bg-resolve-accent border-resolve-accent active:opacity-80'
                  }`}
                onPress={handleSaveAndConfirm}
                disabled={!isValid || beats.length === 0}
                activeOpacity={0.85}
              >
                {mode === 'record' ? (
                  <View className="w-2 h-2 rounded-full bg-white mr-0.5" />
                ) : (
                  <Check size={12} color={(!isValid || beats.length === 0) ? '#888888' : '#000000'} />
                )}
                <Text className={`font-mono text-[10px] font-bold uppercase ${
                  (!isValid || beats.length === 0)
                    ? 'text-resolve-muted'
                    : mode === 'record'
                      ? 'text-white'
                      : 'text-black'
                }`}>
                  {mode === 'record' ? 'ARM & RECORD' : 'LOAD TO GALLERY'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </View>
    </Modal>
  );
}