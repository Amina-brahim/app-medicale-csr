import React from 'react'
import { useNavigate } from "react-router-dom"
import LogoCsr from './images/logo_csr.png';

const Acceuil = ({ socket }) => {
  const navigate = useNavigate()

  function sirConsulte() {
    navigate("/MGSpecialities")
  }

  function sirLabo() {
    navigate("/MGLabo")
  }

  function sirCaisse() {
    navigate("/MGCaisse")
  }

  function sirAdmin() {
    navigate("/Administration")
  }

  function sirKinesi() {
    navigate("/Ulterieure")
  }

  return (
    <>
      <div className="entete TC">
        <div className="marges_logo_5px">
          <img className='logo_clinique marges_logo_5px' src={LogoCsr} alt="Tchad" id="logoIred" />
        </div>
        <div className='titre_entete'>
          <h2 className='titre_entete'>CSR - N'Djamena - TCHAD</h2>
          <h3 className='sous_titre_entete'>Gestion de Clinique</h3>
        </div>
      </div>
      <form className='form_margin ' >
        <div>
          <h3 className='titre_noir'>Vuillez sélectionner un service</h3>
        </div>
      </form>
      <form className='ftt__footer BC flex-column'>
        <div className='flex-row'>
          <button className="glow-on-hover_MGAcceuil  MenuBtn" type="button" id='btn1' onClick={sirConsulte}>Consultations</button>
          <button className="glow-on-hover_MGAcceuil  MenuBtn" type="button" id='btn2' onClick={sirLabo}>Analyses Laboratoire</button>
        </div>
        <div className='div-flex-row' >
          <button className="glow-on-hover_MGAcceuil  MenuBtn" type="button" id='btn3' onClick={sirAdmin}>Administration</button>
          <button className="glow-on-hover_MGAcceuil  MenuBtn" type="button" id='btn5' onClick={sirCaisse}>Caisse</button>
        </div>
      </form>
    </>
  )
}

export default Acceuil
