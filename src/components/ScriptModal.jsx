import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { X, FileText, Sparkles, Check } from 'lucide-react-native';
import { SAMPLE_SCRIPTS } from '../utils/sampleScripts';
import { parseScript } from '../utils/scriptParser';

export function ScriptModal({
  visible,
  onClose,
  currentRawText,
  onApplyScript,
  currentWpm,
  onChangeWpm
}) {
  const [scriptText, setScriptText] = useState(currentRawText || SAMPLE_SCRIPTS[0].rawText);
  const [activeSampleId, setActiveSampleId] = useState('shorts-hook');

  const parsed = parseScript(scriptText, currentWpm);

  const handleSelectSample = (sample) => {
    setActiveSampleId(sample.id);
    setScriptText(sample.rawText);
  };

  const handleCleanText = () => {
    const cleaned = scriptText
      .replace(/^#+\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/^(Host|Narrator|Speaker|You):\s*/gmi, '')
      .replace(/\[Visual:.*?\]/gi, '')
      .trim();
    setScriptText(cleaned);
  };

  const handleSave = () => {
    onApplyScript(scriptText);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.titleGroup}>
              <View style={styles.iconCircle}>
                <FileText size={18} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Script Studio & LLM Loader</Text>
                <Text style={styles.modalSubtitle}>Paste any LLM script. Parses 100% offline.</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Preset Templates Row */}
          <View style={styles.presetsRow}>
            <Text style={styles.presetsLabel}>Templates:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsScroll}>
              {SAMPLE_SCRIPTS.map(sample => (
                <TouchableOpacity
                  key={sample.id}
                  style={[styles.samplePill, activeSampleId === sample.id && styles.samplePillActive]}
                  onPress={() => handleSelectSample(sample)}
                >
                  <Text style={[styles.samplePillText, activeSampleId === sample.id && styles.samplePillTextActive]}>
                    {sample.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Text Input & Tools */}
          <View style={styles.editorArea}>
            <View style={styles.editorToolbar}>
              <Text style={styles.editorHint}>Use [HOOK], [pause 1.5s], (look into lens)</Text>
              <TouchableOpacity style={styles.cleanBtn} onPress={handleCleanText}>
                <Sparkles size={12} color="#FBBF24" />
                <Text style={styles.cleanBtnText}>Format LLM Output</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.textInput}
              multiline
              value={scriptText}
              onChangeText={setScriptText}
              placeholder="Paste your script here..."
              placeholderTextColor="#64748B"
              textAlignVertical="top"
            />
          </View>

          {/* Stats Bar */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Beats</Text>
              <Text style={styles.statVal}>{parsed.beats.length}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Words</Text>
              <Text style={styles.statVal}>{parsed.totalWords}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Est. Time</Text>
              <Text style={[styles.statVal, { color: '#10B981' }]}>
                {parsed.estimatedMinutes > 0 ? `${parsed.estimatedMinutes}m ` : ''}{parsed.estimatedSeconds}s
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Target Pace</Text>
              <Text style={[styles.statVal, { color: '#38BDF8' }]}>{currentWpm} WPM</Text>
            </View>
          </View>

          {/* Footer Save */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.applyBtn, parsed.beats.length === 0 && styles.btnDisabled]} 
              onPress={handleSave}
              disabled={parsed.beats.length === 0}
            >
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.applyBtnText}>Load into Studio ({parsed.beats.length} Beats)</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 16
  },
  modalCard: {
    backgroundColor: '#0F121C',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    maxHeight: '88%',
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)'
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 11
  },
  closeBtn: {
    padding: 4
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)'
  },
  presetsLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600'
  },
  presetsScroll: {
    gap: 8
  },
  samplePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  samplePillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: '#38BDF8'
  },
  samplePillText: {
    color: '#94A3B8',
    fontSize: 11
  },
  samplePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  editorArea: {
    padding: 16,
    gap: 8
  },
  editorToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  editorHint: {
    color: '#64748B',
    fontSize: 10
  },
  cleanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  cleanBtnText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '600'
  },
  textInput: {
    height: 180,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#FFFFFF',
    padding: 12,
    fontSize: 13,
    lineHeight: 20
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  statLabel: {
    color: '#64748B',
    fontSize: 9
  },
  statVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace'
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)'
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  cancelText: {
    color: '#94A3B8',
    fontSize: 13
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  btnDisabled: {
    opacity: 0.4
  }
});
