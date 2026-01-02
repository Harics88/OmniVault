import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import DailyLog from './pages/DailyLog'
import Tasks from './pages/Tasks'
import Notes from './pages/Notes'
import Snippets from './pages/Snippets'
import Bookmarks from './pages/Bookmarks'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="daily-log" element={<DailyLog />} />
                    <Route path="daily-log/:date" element={<DailyLog />} />
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="notes" element={<Notes />} />
                    <Route path="notes/:id" element={<Notes />} />
                    <Route path="snippets" element={<Snippets />} />
                    <Route path="snippets/:id" element={<Snippets />} />
                    <Route path="bookmarks" element={<Bookmarks />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App
