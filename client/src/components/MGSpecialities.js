import React from 'react'
import { useNavigate } from "react-router-dom"
import LogoCsr from './images/logo_csr.png';

const Specialities = ({ socket }) => {
  const navigate = useNavigate()


  function sirNephro() {
    navigate("/MGConsult")
  }

  function sirUrologie() {
    navigate("/MGConsult")
  }

  function sirGHE() {
    navigate("/MGConsult")
  }

  function sirRhumato() {
    navigate("/MGConsult")
  }

  function sirPediatrie() {
    navigate("/MGConsult")
  }

  function sirGyneco() {
    navigate("/MGConsult")
  }

  function sirUrgences() {
    navigate("/MGConsult")
  }

  function sirRetour() {
    navigate("/MGConsult")
  }

  return (
    <>
      <div className="entete TC">
        <div classNamme="marges_logo_5px">
          <img class='logo_clinique marges_logo_5px' src={LogoCsr} alt="Tchad" id="logoIred" />
        </div>
        <div className='titre_entete'>
          <h2 className='titre_entete'>CSR - N'Djamena - TCHAD</h2>
          <h3 className='sous_titre_entete'>Gestion de Clinique</h3>
          <h3 className='sous_titre_entete'>Consultations</h3>

        </div>
      </div>
      <form className='form_margin ' >
        <div>
          <h3 className='titre_noir'>Vuillez sélectionner une spécialité</h3>
        </div>
      </form>
      <form className='ftt__footer BC flex-column'>
        <div className='flex-row'>
          <button className="glow-on-hover_MGAcceuil  MenuBtn" type="button" id='btn1' onClick={sirNephro}>Néphropathie</button>
          <button className="glow-on-hover_MGAcceuil  MenuBtn" type="button" id='btn3' onClick={sirUrologie}>Urologie</button>
          <button className="glow-on-hover_MGAcceuil  MenuBtn" type="button" id='btn4' onClick={sirGHE}>Gastro-Hepato-Entérologie</button>
          <button className="glow-on-hover_MGAcceuil  MenuBtn" type="button" id='btn2' onClick={sirRhumato}>Rhumathologie</button>
        </div>
        <div className='flex-row'>
          <button className="glow-on-hover_MGAcceuil  MenuBtn" type="button" id='btn2' onClick={sirPediatrie}>Pédiatrie</button>
          <button className="glow-on-hover_MGAcceuil  MenuBtn" type="button" id='btn2' onClick={sirGyneco}>Gynécologie</button>
          <button className="glow-on-hover_MGAcceuil  MenuBtn" type="button" id='btn2' onClick={sirUrgences}>Cardiologie</button>
          <button className="glow-on-hover_MGAcceuil  MenuBtn" type="button" id='btn2' onClick={sirUrgences}>O.R.L</button>
        </div>
        <div className='flex-row'>
          <button className="glow-on-hover_MGAcceuil  MenuBtn" type="button" id='btn2' onClick={sirUrgences}>Kinésithérapie</button>
          <button className="glow-on-hover_MGAcceuil  MenuBtn" type="button" id='btn2' onClick={sirUrgences}>Neurologie</button>
          <button className="glow-on-hover_MGAcceuil  MenuBtn" type="button" id='btn2' onClick={sirUrgences}>Endocrinologie</button>
          <button className="glow-on-hover_MGAcceuil  MenuBtn" type="button" id='btn2' onClick={sirUrgences}>Traumatologie</button>
        </div>
        <div className='flex-row'>
          <button className="glow-on-hover_MGAcceuil  MenuBtn" type="button" id='btn5' onClick={sirRetour}>Dermatologie</button>
          <button className="glow-on-hover_MGAcceuil  MenuBtn" type="button" id='btn5' onClick={sirRetour}>Urgences</button>
          <button className="glow-on-hover_MGAcceuil  MenuBtn" type="button" id='btn5' onClick={sirRetour}>Retour</button>          
          <button className="glow-on-hover_MGAcceuil  MenuBtn" type="button" id='btn6' >Aide / Assistance</button>
        </div>
      </form>
    </>
  )
}

export default Specialities