import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import DailyLog from './pages/DailyLog'
import Tasks from './pages/Tasks'
import TaskPopout from './pages/TaskPopout'
import Notes from './pages/Notes'
import RecycleBin from './pages/RecycleBin'
import Snippets from './pages/Snippets'
import Bookmarks from './pages/Bookmarks'
import Vault from './pages/Vault'
import Registry from './pages/Registry'
import EntityDetail from './pages/EntityDetail'
import Settings from './pages/Settings'
import Shortcuts from './pages/Shortcuts'
import Timeline from './pages/Timeline'
import { ToastProvider } from './components/Toast'
import NoteSwitcher from './components/NoteSwitcher'

function App() {
    return (
        <ToastProvider>
            <BrowserRouter>
                <NoteSwitcher />
                <Routes>
                    {/* Standalone popout routes (no Layout) */}
                    <Route path="/tasks/:id" element={<TaskPopout />} />

                    {/* Main app routes (with Layout) */}
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Home />} />
                        <Route path="timeline" element={<Timeline />} />
                        <Route path="daily-log" element={<DailyLog />} />
                        <Route path="daily-log/:date" element={<DailyLog />} />
                        <Route path="tasks" element={<Tasks />} />
                        <Route path="notes" element={<Notes />} />
                        <Route path="notes/:id" element={<Notes />} />
                        <Route path="recycle-bin" element={<RecycleBin />} />
                        <Route path="snippets" element={<Snippets />} />
                        <Route path="snippets/:id" element={<Snippets />} />
                        <Route path="bookmarks" element={<Bookmarks />} />
                        <Route path="registry" element={<Registry />} />
                        <Route path="registry/:id" element={<EntityDetail />} />
                        <Route path="vault" element={<Vault />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="shortcuts" element={<Shortcuts />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </ToastProvider>
    )
}

export default App
