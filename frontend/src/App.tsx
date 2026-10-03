import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './components/Toast';
import { Sidebar, NavItem } from './components/Sidebar';
import { Header } from './components/Header';
import { TaskModal } from './components/TaskModal';
import { TaskDetailDrawer } from './components/TaskDetailDrawer';
import { BreakdownModal } from './components/BreakdownModal';
import { ConfirmModal } from './components/ConfirmModal';

import { DashboardPage } from './pages/DashboardPage';
import { AddWorkPage } from './pages/AddWorkPage';
import { TasksPage } from './pages/TasksPage';
import { PlannerPage } from './pages/PlannerPage';
import { AssistantPage } from './pages/AssistantPage';
import { SettingsPage } from './pages/SettingsPage';

import { Task, TaskCreateInput, TaskUpdateInput } from './types/task';
import { DashboardStats } from './types/dashboard';
import { api } from './services/api';

const MainApp: React.FC = () => {
  const { addToast } = useToast();
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Core Data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);

  // Modals & Drawers
  const [taskFilter, setTaskFilter] = useState<{ status?: string; priority?: string } | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
  const [taskToBreakdown, setTaskToBreakdown] = useState<Task | null>(null);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [tasksRes, statsRes] = await Promise.all([
        api.getTasks(),
        api.getDashboard(),
      ]);
      setTasks(tasksRes);
      setStats(statsRes);
    } catch (err: any) {
      addToast('error', 'Failed to load data', err.message);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Task actions
  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      const updated = await api.updateTask(task.id, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      if (selectedTask?.id === updated.id) {
        setSelectedTask(updated);
      }
      // Refresh stats
      const statsRes = await api.getDashboard();
      setStats(statsRes);

      if (newStatus === 'completed') {
        addToast('success', 'Task Completed! 🎉', `"${task.title}" has been completed.`);
      }
    } catch (err: any) {
      addToast('error', 'Status update failed', err.message);
    }
  };

  const handleSaveTask = async (data: TaskCreateInput | TaskUpdateInput) => {
    try {
      if (taskToEdit) {
        const updated = await api.updateTask(taskToEdit.id, data as TaskUpdateInput);
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        if (selectedTask?.id === updated.id) setSelectedTask(updated);
        addToast('success', 'Task updated', `"${updated.title}" updated.`);
      } else {
        const created = await api.createTask(data as TaskCreateInput);
        setTasks((prev) => [created, ...prev]);
        addToast('success', 'Task created', `"${created.title}" added to workspace.`);
      }
      setTaskModalOpen(false);
      setTaskToEdit(null);
      const statsRes = await api.getDashboard();
      setStats(statsRes);
    } catch (err: any) {
      addToast('error', 'Failed to save task', err.message);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await api.deleteTask(taskToDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      if (selectedTask?.id === taskToDelete.id) {
        setSelectedTask(null);
        setDetailDrawerOpen(false);
      }
      addToast('info', 'Task deleted', `"${taskToDelete.title}" removed.`);
      setTaskToDelete(null);
      setConfirmModalOpen(false);
      const statsRes = await api.getDashboard();
      setStats(statsRes);
    } catch (err: any) {
      addToast('error', 'Delete failed', err.message);
    }
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    try {
      const updated = await api.toggleSubtask(taskId, subtaskId);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      if (selectedTask?.id === updated.id) setSelectedTask(updated);
    } catch (err: any) {
      addToast('error', 'Subtask update failed', err.message);
    }
  };

  const handleAddSubtask = async (taskId: string, title: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newSubtask = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      completed: false,
    };
    try {
      const updated = await api.updateTask(taskId, {
        subtasks: [...task.subtasks, newSubtask],
      });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      if (selectedTask?.id === updated.id) setSelectedTask(updated);
      addToast('success', 'Subtask added', `Added "${title}".`);
    } catch (err: any) {
      addToast('error', 'Failed to add subtask', err.message);
    }
  };

  const handleSubtasksAddedFromBreakdown = async (
    taskId: string,
    newSubtasks: { id: string; title: string; completed: boolean }[]
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    try {
      const updated = await api.updateTask(taskId, {
        subtasks: [...task.subtasks, ...newSubtasks],
      });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      if (selectedTask?.id === updated.id) setSelectedTask(updated);
      setBreakdownModalOpen(false);
      setTaskToBreakdown(null);
    } catch (err: any) {
      addToast('error', 'Failed to save subtasks', err.message);
    }
  };

  const handleLoadDemoWorkspace = async () => {
    setLoadingDemo(true);
    try {
      const res = await api.seedDemoWorkspace();
      addToast('success', 'Demo Workspace Loaded', res.message);
      await loadData();
      setCurrentTab('dashboard');
    } catch (err: any) {
      addToast('error', 'Failed to load demo', err.message);
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleClearWorkspace = async () => {
    try {
      await Promise.all(tasks.map((t) => api.deleteTask(t.id)));
      setTasks([]);
      const statsRes = await api.getDashboard();
      setStats(statsRes);
      addToast('info', 'Workspace cleared', 'All tasks have been removed.');
    } catch (err: any) {
      addToast('error', 'Clear failed', err.message);
    }
  };

  const activeTaskCount = tasks.filter((t) => t.status !== 'completed').length;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab !== 'tasks') setTaskFilter(null);
          setCurrentTab(tab);
        }}
        activeTaskCount={activeTaskCount}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <Header
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onNavigateAddWork={() => setCurrentTab('add-work')}
          onNavigatePlanner={() => setCurrentTab('planner')}
          onLoadDemo={handleLoadDemoWorkspace}
          isLoadingDemo={loadingDemo}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              stats={stats}
              loading={loading}
              onNavigateAddWork={() => setCurrentTab('add-work')}
              onNavigatePlanner={() => setCurrentTab('planner')}
              onNavigateTasks={(filter) => {
                setTaskFilter(filter || null);
                setCurrentTab('tasks');
              }}
              onToggleStatus={handleToggleStatus}
              onEditTask={(t) => {
                setTaskToEdit(t);
                setTaskModalOpen(true);
              }}
              onDeleteTask={(t) => {
                setTaskToDelete(t);
                setConfirmModalOpen(true);
              }}
              onViewDetails={(t) => {
                setSelectedTask(t);
                setDetailDrawerOpen(true);
              }}
              onBreakdown={(t) => {
                setTaskToBreakdown(t);
                setBreakdownModalOpen(true);
              }}
              onLoadDemo={handleLoadDemoWorkspace}
            />
          )}

          {currentTab === 'tasks' && (
            <TasksPage
              tasks={tasks}
              loading={loading}
              initialFilter={taskFilter}
              onToggleStatus={handleToggleStatus}
              onEditTask={(t) => {
                setTaskToEdit(t);
                setTaskModalOpen(true);
              }}
              onDeleteTask={(t) => {
                setTaskToDelete(t);
                setConfirmModalOpen(true);
              }}
              onViewDetails={(t) => {
                setSelectedTask(t);
                setDetailDrawerOpen(true);
              }}
              onBreakdown={(t) => {
                setTaskToBreakdown(t);
                setBreakdownModalOpen(true);
              }}
              onCreateNewTask={() => {
                setTaskToEdit(null);
                setTaskModalOpen(true);
              }}
            />
          )}

          {currentTab === 'planner' && (
            <PlannerPage onNavigateAssistant={() => setCurrentTab('assistant')} />
          )}

          {currentTab === 'assistant' && (
            <AssistantPage
              tasks={tasks}
              onViewTaskDetails={(t) => {
                setSelectedTask(t);
                setDetailDrawerOpen(true);
              }}
            />
          )}

          {currentTab === 'add-work' && (
            <AddWorkPage
              onTasksApproved={async () => {
                await loadData();
                setCurrentTab('dashboard');
              }}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsPage
              onReloadDemo={handleLoadDemoWorkspace}
              onClearWorkspace={handleClearWorkspace}
              taskCount={tasks.length}
            />
          )}
        </main>
      </div>

      {/* Task Modal (Create & Edit) */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
      />

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={detailDrawerOpen}
        onClose={() => {
          setDetailDrawerOpen(false);
          setSelectedTask(null);
        }}
        onToggleSubtask={handleToggleSubtask}
        onAddSubtask={handleAddSubtask}
        onBreakdown={(t) => {
          setTaskToBreakdown(t);
          setBreakdownModalOpen(true);
        }}
        onEdit={(t) => {
          setDetailDrawerOpen(false);
          setTaskToEdit(t);
          setTaskModalOpen(true);
        }}
        onDelete={(t) => {
          setTaskToDelete(t);
          setConfirmModalOpen(true);
        }}
        onToggleStatus={handleToggleStatus}
      />

      {/* Breakdown Modal */}
      <BreakdownModal
        task={taskToBreakdown}
        isOpen={breakdownModalOpen}
        onClose={() => {
          setBreakdownModalOpen(false);
          setTaskToBreakdown(null);
        }}
        onSubtasksAdded={handleSubtasksAddedFromBreakdown}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
};

export default App;
