import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import { X, Film, Sparkles, CheckCircle2, Trash2 } from 'lucide-react-native';
import { stitchTakes } from '../utils/videoStitcher';

export function ExportModal({
  visible,
  onClose,
  beats,
  recordingTakes,
  onClearSession
}) {
  const [isStitching, setIsStitching] = useState(false);
  const [stitchProgress, setStitchProgress] = useState(0);
  const [finalVideoPath, setFinalVideoPath] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleStitch = async () => {
    setIsStitching(true);
    setStitchProgress(5);
    setErrorMessage(null);

    const result = await stitchTakes(recordingTakes, (progress) => {
      setStitchProgress(progress);
    });

    setIsStitching(false);

    if (result.success) {
      setFinalVideoPath(result.outputPath);
    } else {
      setErrorMessage(result.error || 'Failed to stitch takes');
    }
  };

  const recordedCount = recordingTakes.filter(Boolean).length;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.titleGroup}>
              <View style={styles.iconCircle}>
                <Film size={20} color="#10B981" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Auto-Stitch & Export Studio</Text>
                <Text style={styles.modalSubtitle}>Clean video export without prompter overlay.</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.modalBody}>
            {/* Takes status list */}
            <Text style={styles.sectionHeading}>Takes Ready for Stitching ({recordedCount}/{beats.length})</Text>

            <ScrollView style={styles.takesList} showsVerticalScrollIndicator={false}>
              {beats.map((beat, index) => {
                const hasTake = !!recordingTakes[index];
                return (
                  <View key={beat.id} style={[styles.takeItem, hasTake && styles.takeItemReady]}>
                    <Text style={styles.takeNum}>#{index + 1}</Text>
                    <View style={styles.takeInfo}>
                      <Text style={styles.takeSection}>{beat.section}</Text>
                      <Text style={styles.takeSnippet} numberOfLines={1}>{beat.spokenText}</Text>
                    </View>
                    <View style={styles.takeBadge}>
                      {hasTake ? (
                        <CheckCircle2 size={16} color="#10B981" />
                      ) : (
                        <Text style={styles.pendingText}>Pending</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Stitching Progress or Success Result */}
            {isStitching && (
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Concatenating takes with FFmpeg...</Text>
                  <Text style={styles.progressPercent}>{stitchProgress}%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${stitchProgress}%` }]} />
                </View>
              </View>
            )}

            {finalVideoPath && (
              <View style={styles.successBox}>
                <CheckCircle2 size={24} color="#10B981" />
                <View style={styles.successTextCol}>
                  <Text style={styles.successTitle}>Video Stitched Cleanly!</Text>
                  <Text style={styles.successPath} numberOfLines={2}>{finalVideoPath}</Text>
                </View>
              </View>
            )}

            {errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionButtonsCol}>
              <TouchableOpacity
                style={[styles.stitchMainBtn, (isStitching || recordedCount === 0) && styles.btnDisabled]}
                onPress={handleStitch}
                disabled={isStitching || recordedCount === 0}
              >
                {isStitching ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Sparkles size={16} color="#FFFFFF" />
                    <Text style={styles.stitchBtnText}>Stitch All Takes Instantly</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.clearSessionBtn}
                onPress={() => {
                  onClearSession();
                  onClose();
                }}
              >
                <Trash2 size={14} color="#EF4444" />
                <Text style={styles.clearSessionText}>Reset All Takes</Text>
              </TouchableOpacity>
            </View>
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
    maxHeight: '85%',
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
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
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
  modalBody: {
    padding: 16,
    gap: 14
  },
  sectionHeading: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600'
  },
  takesList: {
    maxHeight: 180
  },
  takeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  takeItemReady: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)'
  },
  takeNum: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'monospace'
  },
  takeInfo: {
    flex: 1
  },
  takeSection: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700'
  },
  takeSnippet: {
    color: '#94A3B8',
    fontSize: 11
  },
  takeBadge: {
    minWidth: 40,
    alignItems: 'flex-end'
  },
  pendingText: {
    color: '#64748B',
    fontSize: 10
  },
  progressContainer: {
    gap: 6
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  progressLabel: {
    color: '#38BDF8',
    fontSize: 11
  },
  progressPercent: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'monospace'
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981'
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    padding: 12,
    borderRadius: 10
  },
  successTextCol: {
    flex: 1
  },
  successTitle: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700'
  },
  successPath: {
    color: '#A7F3D0',
    fontSize: 10,
    fontFamily: 'monospace'
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)'
  },
  errorText: {
    color: '#F87171',
    fontSize: 11
  },
  actionButtonsCol: {
    gap: 10,
    marginTop: 4
  },
  stitchMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12
  },
  stitchBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  clearSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6
  },
  clearSessionText: {
    color: '#EF4444',
    fontSize: 12
  },
  btnDisabled: {
    opacity: 0.4
  }
});
