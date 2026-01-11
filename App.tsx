import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EventInspector from './components/EventInspector';
import PolicyManager from './components/PolicyManager';
import { generateMockEvents, applyPolicy, fetchEventsFromDb, parseAndImportCdmFile, saveEventsToDb, clearDb } from './services/dataService';
import { DEFAULT_POLICY } from './constants';
import { CdmEvent, PolicyConfig } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  
  // App State
  const [events, setEvents] = useState<CdmEvent[]>([]);
  const [policy, setPolicy] = useState<PolicyConfig>(DEFAULT_POLICY);

  // Initialize Data from DB
  const refreshData = async () => {
      const storedEvents = await fetchEventsFromDb();
      setEvents(storedEvents);
  };

  useEffect(() => {
    const loadData = async () => {
        const storedEvents = await fetchEventsFromDb();
        if (storedEvents.length > 0) {
            setEvents(storedEvents);
        } else {
            // Optional: Generate mock data if DB is empty for demo, 
            // but user can now clear it.
            const initialData = generateMockEvents(50, DEFAULT_POLICY);
            await saveEventsToDb(initialData);
            setEvents(initialData);
        }
    };
    loadData();
  }, []);

  const handleApplyPolicy = async () => {
    const retriagedEvents = events.map(e => applyPolicy(e, policy));
    setEvents(retriagedEvents);
    await saveEventsToDb(retriagedEvents);
    alert("Policy applied. Triage lanes updated and saved to DB.");
  };

  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
    setCurrentView('inspector');
  };

  const handleUpdateEvent = async (updated: CdmEvent) => {
    const newEvents = events.map(e => e.id === updated.id ? applyPolicy(updated, policy) : e);
    setEvents(newEvents);
    await saveEventsToDb([updated]); // Update specific item in DB
  };

  const handleImport = async (file: File) => {
      setIsImporting(true);
      setImportProgress(0);
      try {
        await parseAndImportCdmFile(file, policy, (progress) => {
            setImportProgress(progress);
        });
        await refreshData();
      } catch (e) {
        console.error(e);
        alert("Failed to parse CDM file. Ensure it is CSV with correct headers.");
      } finally {
        setIsImporting(false);
        setImportProgress(0);
      }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard 
            events={events} 
            onSelectEvent={handleSelectEvent} 
            onImport={handleImport}
            isImporting={isImporting}
            importProgress={importProgress}
        />;
      case 'inspector':
        const event = events.find(e => e.id === selectedEventId) || null;
        return (
            <EventInspector 
                event={event} 
                onBack={() => setCurrentView('dashboard')} 
                onUpdateEvent={handleUpdateEvent}
            />
        );
      case 'nightmare':
         return (
             <div className="h-full flex flex-col">
                <div className="p-6 bg-rose-900/10 border-b border-rose-900/50">
                    <h2 className="text-xl font-bold text-rose-500 flex items-center gap-2">
                        Nightmare Watch
                    </h2>
                    <p className="text-rose-300/70 text-sm">Filtered view for High Urgency + High Risk events.</p>
                </div>
                <Dashboard 
                    events={events.filter(e => e.lane === 'ACTION_NOW')} 
                    onSelectEvent={handleSelectEvent} 
                    onImport={handleImport}
                    isImporting={isImporting}
                    importProgress={importProgress}
                />
             </div>
         );
      case 'policy':
        return <PolicyManager policy={policy} setPolicy={setPolicy} onApply={handleApplyPolicy} />;
      default:
        return <div className="p-10 text-space-700">View not implemented</div>;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-space-950 text-space-100 font-sans">
      <Sidebar currentView={currentView} setView={(view) => {
          setCurrentView(view);
          if (view !== 'inspector') setSelectedEventId(null);
      }} />
      <main className="flex-1 overflow-hidden relative">
         {renderContent()}
      </main>
    </div>
  );
};

export default App;