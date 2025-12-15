import React from 'react'
import { useNavigate } from "react-router-dom"
import Nse from './images/logo_nse.png';

const Acceuil = ({ socket }) => {
  const navigate = useNavigate()
  function sirAcceuil() {
    navigate("/PageAcceuil")
  }
  return (
    <>
      <div className="entete TC flex-row">
        <div classNamme='logo_clinique'>
          <img class='logo_clinique' src={Nse} alt="Tchad" id="logoIred" />
        </div>
        <div>
          <h2 className='titre_entete'>Vous utilisez GesCAB V1.0</h2>
          <br></br>
          <br></br>
          <h2 className='sous_titre_entete'>La fonction solicitée sera disponible Ulterieurement dans GesCAB V1.1</h2>
        </div>
      </div>

      <div className='ftt__footer BC'>
        <form className='form'>


          <span> | </span>
          <button className="glow-on-hover MenuBtn" type="button" id='Autres' onClick={sirAcceuil}>Fermer</button>
          <span> | </span>
          <button className="glow-on-hover MenuBtn" type="button" id='Aide' >Aide / Assistance</button>

        </form>
      </div>
    </>
  )
}

export default Acceuil