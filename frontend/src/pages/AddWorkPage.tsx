import React, { useState } from 'react';
import { ExtractedTask, TaskCreateInput } from '../types/task';
import { FileUploader } from '../components/FileUploader';
import { PriorityBadge } from '../components/PriorityBadge';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import {
  Sparkles,
  FileText,
  Upload,
  Calendar,
  Clock,
  User,
  Trash2,
  Edit2,
  CheckCircle2,
  Plus,
  Loader2,
  ArrowRight,
  ListTodo,
  X,
} from 'lucide-react';

interface AddWorkPageProps {
  onTasksApproved: () => void;
}

const SAMPLE_MEETING_NOTES = `Project meeting:
Rahul will finish authentication by Friday.
Priya will prepare the presentation by Thursday.
I need to test the API tomorrow.
The project must be submitted on Monday.`;

const SAMPLE_HOSPITAL_BRIEF = `Hospital Shift Briefing:
Dr. Patel will review ICU patient charts before 8:00 AM.
Nurse Sarah needs to calibrate the dialysis machines by 10:30 AM.
The pharmacy team must restock emergency antibiotics by 2:00 PM.
Final discharge reports must be filed with admin by 5:00 PM.`;

const SAMPLE_KITCHEN_LOG = `Bistro Kitchen Log:
Head Chef Antoine will prepare the sourdough starter at 5:30 AM.
Sous Chef Maria must inspect the seafood delivery before 9:00 AM.
Dishwasher Leo needs to sanitize the walk-in refrigeration units by 1:00 PM.
The dinner service pre-shift tasting is scheduled for 4:30 PM with the front-of-house team.`;

const SAMPLE_CONSTRUCTION_LOG = `Site Meeting Log - Tower Phase 2:
Site Engineer Marcus will conduct the foundation load test by Thursday 11:00 AM.
Safety Inspector Chen must approve the tower crane certification by Friday afternoon.
Foreman Jackson needs to oversee the 400 cubic yard concrete pour on Saturday 7:00 AM.
Environmental officer Lisa will file the noise compliance report on Monday.`;

// Helper for fallback reasoning summary if needed
const generateFallbackReasoning = (tasks: ExtractedTask[]): string => {
  const highPriorityCount = tasks.filter(
    (t) => (t.priority as string) === 'urgent' || t.priority === 'high'
  ).length;
  const parts: string[] = [];
  if (highPriorityCount > 0) {
    parts.push(
      `${highPriorityCount} urgent or high-priority task${highPriorityCount > 1 ? 's' : ''} detected.`
    );
  }
  const blockedTasks = tasks.filter((t) => t.dependencies && t.dependencies.length > 0);
  if (blockedTasks.length > 0) {
    const firstBlocker = blockedTasks[0].dependencies?.[0];
    if (firstBlocker) {
      parts.push(`${firstBlocker} should be completed before ${blockedTasks[0].title}.`);
    }
  }
  const totalMin = tasks.reduce((acc, t) => acc + (t.estimated_minutes || 30), 0);
  if (totalMin > 480) {
    parts.push(`Your workload (${(totalMin / 60).toFixed(1)}h) exceeds today's standard 8-hour capacity.`);
  }
  return parts.length > 0
    ? parts.join(' ')
    : 'Action items parsed and prioritized based on deadlines and dependencies.';
};

export const AddWorkPage: React.FC<AddWorkPageProps> = ({ onTasksApproved }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(1);
  const [reviewTasks, setReviewTasks] = useState<ExtractedTask[]>([]);
  const [summary, setSummary] = useState('');
  const [peopleDetected, setPeopleDetected] = useState<string[]>([]);
  const [reasoningSummary, setReasoningSummary] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Editing state within review
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);

  const handleAnalyze = async () => {
    if (activeTab === 'text' && !textInput.trim()) {
      addToast('warning', 'Missing content', 'Please enter meeting notes or instructions to analyze.');
      return;
    }
    if (activeTab === 'file' && !selectedFile) {
      addToast('warning', 'Missing file', 'Please select a PDF or DOCX file to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(1);

    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1200);

    try {
      if (activeTab === 'text') {
        const result = await api.analyzeText(textInput);
        setReviewTasks(result.tasks);
        setSummary(result.summary);
        setPeopleDetected(result.people_detected || []);
        setReasoningSummary(result.reasoning_summary || generateFallbackReasoning(result.tasks));
        addToast('success', 'Analysis complete', `Extracted ${result.tasks.length} structured tasks.`);
      } else if (selectedFile) {
        const result = await api.uploadDocument(selectedFile, true);
        if (result.analysis) {
          setReviewTasks(result.analysis.tasks);
          setSummary(result.analysis.summary);
          setPeopleDetected(result.analysis.people_detected || []);
          setReasoningSummary(result.analysis.reasoning_summary || generateFallbackReasoning(result.analysis.tasks));
          addToast('success', 'Document analyzed', `Extracted ${result.analysis.tasks.length} tasks from ${selectedFile.name}.`);
        }
      }
    } catch (err: any) {
      addToast('error', 'Analysis failed', err.message || 'Could not process input.');
    } finally {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
    }
  };

  const handleLoadSample = (sample: string) => {
    setActiveTab('text');
    setTextInput(sample);
    addToast('info', 'Sample notes loaded', 'Click "Analyze with AI" to extract structured tasks.');
  };

  const handleDeleteReviewTask = (index: number) => {
    setReviewTasks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateReviewTask = (index: number, updated: ExtractedTask) => {
    setReviewTasks((prev) => prev.map((t, idx) => (idx === index ? updated : t)));
    setEditingTaskIndex(null);
  };

  const handleAddManualReviewTask = (newTask: ExtractedTask) => {
    setReviewTasks((prev) => [...prev, newTask]);
    setManualModalOpen(false);
  };

  const handleApproveAll = async () => {
    if (reviewTasks.length === 0) {
      addToast('warning', 'No tasks to approve', 'Extract or add tasks before approving.');
      return;
    }

    setIsSaving(true);
    try {
      const formattedTasks: TaskCreateInput[] = reviewTasks.map((t) => ({
        title: t.title,
        description: t.description || '',
        priority: t.priority || 'medium',
        status: t.status || 'todo',
        deadline: t.deadline || '',
        estimated_minutes: t.estimated_minutes || 30,
        category: t.category || 'General',
        assignee: t.assignee || 'Me',
        dependencies: t.dependencies || [],
        subtasks: (t.subtasks || []).map((st) => ({
          id: Math.random().toString(36).substring(2, 9),
          title: st.title,
          completed: st.completed || false,
        })),
      }));

      await api.batchCreateTasks(formattedTasks);
      addToast('success', 'All tasks approved and saved!', `Saved ${formattedTasks.length} tasks to your workspace.`);
      setReviewTasks([]);
      setReasoningSummary(null);
      setTextInput('');
      setSelectedFile(null);
      onTasksApproved();
    } catch (err: any) {
      addToast('error', 'Failed to save tasks', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Add Work & Autonomous Extraction
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Convert messy meeting transcripts, slack threads, or project documents into prioritized action items.
        </p>
      </div>

      {/* Input Section (Hidden when reviewing results) */}
      {reviewTasks.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
          {/* Tab Switcher */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'text'
                  ? 'bg-white text-brand-700 shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Paste Notes & Text</span>
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'file'
                  ? 'bg-white text-brand-700 shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload PDF / DOCX</span>
            </button>
          </div>

          <div className="p-6 space-y-5">
            {activeTab === 'text' ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Meeting Transcript or Work Notes
                  </label>
                  {/* Preset Sample Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-slate-400 hidden sm:inline">Try domain:</span>
                    <button
                      type="button"
                      onClick={() => handleLoadSample(SAMPLE_MEETING_NOTES)}
                      className="text-xs font-semibold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg border border-brand-200/60 transition-colors shadow-2xs"
                    >
                      Software
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSample(SAMPLE_HOSPITAL_BRIEF)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200/60 transition-colors shadow-2xs"
                    >
                      Hospital
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSample(SAMPLE_KITCHEN_LOG)}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200/60 transition-colors shadow-2xs"
                    >
                      Culinary
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSample(SAMPLE_CONSTRUCTION_LOG)}
                      className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200/60 transition-colors shadow-2xs"
                    >
                      Construction
                    </button>
                  </div>
                </div>

                <textarea
                  rows={8}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={`Paste unstructured notes here...\n\nExample:\nProject meeting:\nRahul will finish authentication by Friday.\nPriya will prepare the presentation by Thursday.\nI need to test the API tomorrow.\nThe project must be submitted on Monday.`}
                  className="w-full p-4 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-slate-400 resize-none font-mono text-xs sm:text-sm"
                  disabled={isAnalyzing}
                />
              </div>
            ) : (
              <div>
                <FileUploader
                  selectedFile={selectedFile}
                  onFileSelected={setSelectedFile}
                  onClearFile={() => setSelectedFile(null)}
                  disabled={isAnalyzing}
                />
              </div>
            )}

            {/* Analysis Loading Indicator */}
            {isAnalyzing && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-50/90 via-indigo-50/70 to-brand-50/90 border border-brand-200/90 shadow-2xs space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-xs">
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      </div>
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-brand-950 flex items-center gap-2">
                        <span>Understanding your work...</span>
                      </h4>
                      <p className="text-[11px] sm:text-xs text-brand-800 font-medium">
                        {analysisStep === 1 && 'Reading raw notes and extracting key discussion points...'}
                        {analysisStep === 2 && 'Detecting team members, deadlines, and priority levels...'}
                        {analysisStep >= 3 && 'Constructing structured tasks, subtasks & AI reasoning summary...'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-brand-700 bg-white/90 px-2.5 py-1 rounded-full border border-brand-200/80 shadow-2xs">
                    Step {analysisStep} of 3
                  </span>
                </div>
                <div className="w-full bg-brand-200/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-600 h-1.5 rounded-full transition-all duration-700 shadow-2xs"
                    style={{ width: `${(analysisStep / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Powered by Gemini 3.8 Flash with strict JSON schema validation
              </span>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 rounded-xl shadow-xs hover:shadow-brand-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 4. REVIEW AI RESULTS SCREEN */
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Banner */}
          <div className="p-5 rounded-2xl bg-white border border-brand-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {reviewTasks.length} Tasks Extracted
                </span>
                {peopleDetected.length > 0 && (
                  <span className="text-xs text-slate-500">
                    People detected: <strong className="text-slate-800">{peopleDetected.join(', ')}</strong>
                  </span>
                )}
              </div>
              {summary && <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{summary}</p>}
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setManualModalOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>Add Manually</span>
              </button>
              <button
                onClick={handleApproveAll}
                disabled={isSaving}
                className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Approve All ({reviewTasks.length})</span>
              </button>
            </div>
          </div>

          {/* AI Reasoning Summary Banner */}
          {reasoningSummary && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-50/80 via-white to-indigo-50/60 border border-brand-200/90 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700">
                      AI Reasoning Summary
                    </span>
                    <span className="text-[10px] font-semibold bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full">
                      High Signal
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                    {reasoningSummary}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Extracted Tasks Review Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviewTasks.map((task, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:border-brand-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{task.title}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditingTaskIndex(idx)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Edit task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteReviewTask(idx)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove task from batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">{task.description}</p>
                  )}

                  {/* Subtasks Preview */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="mb-4 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Subtasks ({task.subtasks.length})
                      </span>
                      {task.subtasks.map((st, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-2 text-slate-600 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                          <span className="truncate">{st.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Metadata Pills */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={task.priority} size="sm" />
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                      {task.category || 'General'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {task.assignee || 'Me'}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 font-semibold text-rose-600">
                      <Calendar className="w-3.5 h-3.5 text-rose-500" />
                      {task.deadline || 'Upcoming'}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {task.estimated_minutes || 30}m
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reset or Re-extract button */}
          <div className="text-center pt-4">
            <button
              onClick={() => {
                setReviewTasks([]);
                setReasoningSummary(null);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline transition-colors"
            >
              Discard this batch and return to input
            </button>
          </div>
        </div>
      )}

      {/* Inline Edit Modal for Review Task */}
      {editingTaskIndex !== null && (
        <EditReviewTaskModal
          task={reviewTasks[editingTaskIndex]}
          onClose={() => setEditingTaskIndex(null)}
          onSave={(updated) => handleUpdateReviewTask(editingTaskIndex, updated)}
        />
      )}

      {/* Add Manual Task Modal */}
      {manualModalOpen && (
        <EditReviewTaskModal
          task={{
            title: '',
            description: '',
            priority: 'medium',
            status: 'todo',
            deadline: '',
            estimated_minutes: 45,
            category: 'General',
            assignee: 'Me',
            subtasks: [],
            dependencies: [],
          }}
          isNew={true}
          onClose={() => setManualModalOpen(false)}
          onSave={(newTask) => handleAddManualReviewTask(newTask)}
        />
      )}
    </div>
  );
};

// Modal for editing an extracted task card in the Review Screen
const EditReviewTaskModal: React.FC<{
  task: ExtractedTask;
  isNew?: boolean;
  onClose: () => void;
  onSave: (task: ExtractedTask) => void;
}> = ({ task, isNew = false, onClose, onSave }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [deadline, setDeadline] = useState(task.deadline || '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(task.estimated_minutes || 30);
  const [category, setCategory] = useState(task.category || 'General');
  const [assignee, setAssignee] = useState(task.assignee || 'Me');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      ...task,
      title: title.trim(),
      description: description.trim(),
      priority,
      deadline: deadline.trim(),
      estimated_minutes: Number(estimatedMinutes),
      category: category.trim(),
      assignee: assignee.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-elevated border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            {isNew ? 'Add Task to Batch' : 'Edit Extracted Task'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 font-medium"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Assignee</label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl border-slate-200"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Deadline</label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="e.g. Friday 5 PM"
                className="w-full px-3 py-2 border rounded-xl border-slate-200"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Est. Minutes</label>
              <input
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl border-slate-200"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
