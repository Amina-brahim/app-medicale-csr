// client/src/App.js - VERSION MODIFIÉE
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { socket } from './socket-fixed'; // <-- IMPORT MODIFIÉ ICI (supprime socketIO)

// Import de tous vos composants
import Home from "./components/Home"
import PageAcceuil from "./components/PageAcceuil"
import Ulterieure from "./components/Ulterieure"
import MgLabo from "./components/MGLabo"
import MgCaisse from "./components/MGCaisse"
// import socketIO from 'socket.io-client'; // <-- SUPPRIMEZ CETTE LIGNE
import MgPrint from "./components/MGPrint"
import Filtre from "./components/Filtre"
import Administration from "./components/Administration"
import MgApercuConsult from "./components/MGApercuConsult"
import MgConsult from "./components/MGConsult"
import MgSpecialities from "./components/MGSpecialities"
import MgJournaux from './components/MgJournaux'
import FloatingList from './components/FloatingList'
import FloatingDoc from './components/FloatingDoc'

// const socket = socketIO.connect("http://localhost:4600") // <-- SUPPRIMEZ CETTE LIGNE

function App() {
  console.log('🚀 Application démarrée - Socket ID:', socket?.id || 'Non connecté');

  return (
    <BrowserRouter>
      <div>
        <Routes>
          {/* Toutes vos routes avec socket passé en prop */}
          <Route path="/" element={<Home socket={socket} />}></Route>
          <Route path="/PageAcceuil" element={<PageAcceuil socket={socket} />}></Route>
          <Route path="/Ulterieure" element={<Ulterieure socket={socket} />}></Route>
          <Route path="/Administration" element={<Administration socket={socket} />} />
          <Route path="/MgLabo" element={<MgLabo socket={socket} />}></Route>
          <Route path="/MgCaisse" element={<MgCaisse socket={socket} />}></Route>
          <Route path="/MgPrint" element={<MgPrint socket={socket} />}></Route>
          <Route path="/MgApercuConsult" element={<MgApercuConsult socket={socket} />}></Route>
          <Route path="/MgJournaux" element={<MgJournaux socket={socket} />} />
          <Route path="/MgConsult" element={<MgConsult socket={socket} />}></Route>
          <Route path="/MgSpecialities" element={<MgSpecialities socket={socket} />}></Route>
          <Route path="/Filtre" element={<Filtre socket={socket} />}></Route>
          <Route path="/FloatingList" element={<FloatingList socket={socket} />}></Route>
          <Route path="/FloatingDoc" element={<FloatingDoc socket={socket} />}></Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
