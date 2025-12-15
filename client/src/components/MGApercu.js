import React, { useEffect, useState, Component } from 'react';
import { useNavigate } from "react-router-dom"
import { Table } from 'react-table'

import './style.css';
//import { useTable, useBlockLayout, useResizeColumns } from 'react-table'
import TableComponent from './TableComponent';
import Presidence from './images/logo_csr.png';
import { JsonToTable } from "react-json-to-table";
var tmp = "";
let id = 0;
var timer;
var seconds;
const START_DURATION = myData.length + 1;
let lignes = [];

const MGApercu = ({ socket }) => {      
  
   /*function sirAcceuil() {
        socket.emit("apercu", myData)

      }
 const [Lignes, setLignes] = useState(JSON.stringify(myData));
  const initialData = [
    {id:0, NomClient: "", NumID_CSR: "", NumAirTel: "", NumTIGO: "", NumMedecin: "", Mode_Paie_OP: "", Total_OP: "", Remise_OP: "", Dette_OP: "", Jeton_OP: "", isLaboratorized: false },
  ]
  const [list, updateList] = useState([initialData]);
  const [LigneTableData, setLigneTableData] = useState("");
  const navigate = useNavigate()
  const [isTested, setisTested] = useState(false);
  const [currentSeconds, setSeconds] = useState([]);
  const [isStop, setIsStop] = useState(false);
  const [duration, setDuration] = useState(START_DURATION);*/

    /*if (isRunning === true) {
       for (var i = 0; i < myData.length; i++) {
        tmp =(JSON.stringify(myData[i]).toString())
            //---------------------            
            for (var j = 0; j < 11; j++) {
              tmp = (JSON.stringify(myData[i]).toString());
              tmp = (tmp.split(',')[j]);
              tmp = tmp.split(':')[1];
              Mots.push(tmp); 
            }
            //---------------------
           setMots(tmp);
           const newCol = [...list,  {id : list.length,
            NomClient:myData[i]
            }];
            //updateList(Mots);
            updateList(myData[i]);

            /*if (i == 0){
              updateList(newCol);
            }else{
              list.push(newCol);
            }
            Mots.length = 0;
            setMots([])
            tmp = "";
            setValue(JSON.stringify(myData[1]).toString());
            const newList = [...list,{ id: list.length , value: "test"}];
            //alert(newList)
            updateList("test");  
       }
      }
      const initialData = [
        { id: 0, NomClient: "Aucune Tache à faire"}
      ];
      const navigate = useNavigate()
      const [errorMessages, setErrorMessages] = useState({});
      const [isSubmitted, setIsSubmitted] = useState(false);
      const [nomClient, setNomClient] = useState("");
      const [newValue, setValue] = useState("");
      const [list, updateList] = useState(initialData);
      const [Mots, setMots] = useState([]);
      const [isRunning, setIsRunning] = useState(false);
      const [Lignes, setLignes] = useState([]);

      // =======================================================================

    
      const ListItem = ({ NomClient, id, onRemoveClick }) => (
        <div className='list_row'>
          <label className='glow-on-hover_list flex-row'>{NomClient}
          <span> | </span>
          </label>
          <button className='list_bouton' onClick={() => onRemoveClick(id)}>Terminé</button>
        </div>
      );
      // =======================================================================
      
      // =======================================================================
      useEffect(() => {
        socket.on("apercu", data => {
            lignes = (JSON.stringify(myData).toString())
            for (var i = 0; i < myData.length; i++) {
              for (var j = 0; j < 11; j++) {
                tmp = (myData[i].toString());
                tmp = (data.split(',')[j]);
                tmp = tmp.split(':')[1];
                Mots.push(tmp); 
                Lignes.push(Mots);
              }
            alert(Lignes[0])
            const newList = [...list,{ id: list.length , NomClient: Mots[0] }];
            updateList(newList); 
            Mots.length = 0;
            setMots([])
            tmp = ""; 
          }                
        });
  
      })

      const ListExample = () => {
    
        const removeItem = id => {
          updateList(list.filter(item => item.id !== id));
        };
       
        return (
          <div className='global_list' >
           
            {list.map(item => (
              <ListItem key={item.id}  {...item} onRemoveClick={removeItem} />
            ))} 
            
          </div>
        );
      };
    // <label  classNamme='glow-on-hover_bouton' >{newValue}</label>
      //------------------------------------------------------------------------
      return (
        <>
          <div className="entete_labo TC flex-row">
            <div classNamme="logo_clinique">
              <img class='logo_clinique' src={Presidence} alt="Tchad" id="logoIred" />
            </div>
            <div>
              <h2 className='titre_entete'>CSR - N'Djamena - TCHAD</h2>
              <h3 className='sous_titre_entete'>Gestion du Laboratoire<br></br>d'Analyses Médicale</h3>
              <br></br>
              <br></br>
              <h2 className='sous_titre_entete'>File des travaux techniques</h2>
            </div>
          </div>
          <div >
          <JsonToTable json= {
            myData[0]
            } />
            </div>
          <div className='ftt__footer_row BC'>
              <button className="glow-on-hover_bouton " type="button" onClick={sirAcceuil} id='Lyo1' >Fin Session</button>
              <button className="glow-on-hover_bouton " type="button" id='Lyo1' onClick={sirAcceuil} >Imprimer</button>
              <button className="glow-on-hover_bouton " type="button" id='Lyo1' >Aide</button>
          </div>
          </>
      )
    
  }*/

  const [data, setData] = useState([]);

  useEffect(() => {
    // Fetch data from the JSON file
    fetch('/journal.json')
      .then(response => response.json())
      .then(json => setData(json))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  return (
    <div>
    <ul>
      {data.map((user) => (
        <li key={user.id}>{user.NomClient}, {user.NumID_CSR}</li>
      ))}
    </ul>
  </div>
  );
};

  export default MGApercu;
    /*  
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ fontSize: '32px', border: '1px solid black', padding: '8px' }}>ID</th>
            <th style={{ fontSize: '32px', border: '1px solid black', padding: '8px' }}>NomClient</th>
            <th style={{ fontSize: '32px', border: '1px solid black', padding: '8px' }}>NumID_CSR</th>
            <th style={{ fontSize: '32px', border: '1px solid black', padding: '8px' }}>NumAirTel</th>
          </tr>
        </thead>
        <tbody>
          {data.map(user => (
            <tr key={user.id}>
              <td style={{ fontSize: '32px', border: '1px solid black', padding: '8px' }}>{user.id}</td>
              <td style={{ fontSize: '32px', border: '1px solid black', padding: '8px' }}>{user.NomClient}</td>
              <td style={{ fontSize: '32px', border: '1px solid black', padding: '8px' }}>{user.NumID_CSR}</td>
              <td style={{ fontSize: '32px', border: '1px solid black', padding: '8px' }}>{user.NumAirTel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
NumID_CSR: "", NumAirTel: "", NumTIGO:
       <div className='Cadre_Table' >
        <TableComponent data={list} />
        </div>
      const initialData = [
    { NomClient: "", NumID_CSR: "", NumAirTel: "", NumTIGO: "", NumMedecin: "", Mode_Paie_OP: "", Total_OP: "", Remise_OP: "", Dette_OP: "", Jeton_OP: "", isLaboratorized: false },
  ]
<TableComponent data={list} />
    , NumID_CSR, NumAirTel, NumTIGO, NumMedecin, Mode_Paie_OP, Total_OP, Remise_OP, Dette_OP, Jeton_OP, isLaboratorized 
    <div>
      <ul>{Colonne}</ul>
    </div>
   
       <lable className='titre'>{TableData}</lable>
    <div>
       <h1>Table Example</h1>
       <TableComponent data={string} />
     </div>
     <div className='form_analyses' >
  
       {list.map(item => (
         <ListItem key={item.id}  {...item} onRemoveClick={removeItem} />
       ))}
  
     </div>
   
  const receipt = ({ socket }) => {
   
   return (
     <>
   <table>
     <thead>
       <tr>
         <th>Nom Client</th>
         <th>Numéro ID<br></br>Unique</th>
         <th>Montant</th>
         <th>Numéro AirTel</th>
       </tr>
     </thead>
     <tbody>
       {list.map(item => {
         return (
           <tr key={item.NomClient}>
             <td>{item.NomClient}</td>
             <td>{item.NumID_CSR}</td>
             <td>{item.NumAirTel}</td>
             <td>{item.NumTIGO}</td>
           </tr>
         );
       })}
     </tbody>
   </table>
   </>
   )

  const ListItem = ({ NomClient}) => (
    <div className='list_row'>
      <label>{NomClient}</label>
    </div>
    );
  
    const ListExample = () => {
 
    return (
      <div >
       
        {list.map(item => (
          <ListItem key={item.id} {...item}  />
        ))} 
        
      </div>
    );
  };

       useEffect(() => {
      socket.on("rxJournal", (rxJournal) => {
        const transmission = JSON.stringify(rxJournal);
        const RX_Lignes = transmission.split('[');
        const RX_Col = new Array();

        for (i = 1; i < RX_Lignes.length; i++) {
          var tmpLignes = RX_Lignes[i].toString();
          RX_Col[i] = tmpLignes.split(',');

          if (null != RX_Col[i]) {
            var tmpCol = RX_Col[i].toString();
            setMots(tmpCol.split(':'));
            alert(tmpCol.split(':'))
            const newColonne = [...list, {
              NomClient: (Mots[1].split(':')[1]),
              NumID_CSR: (Mots[2].split(':')[1]),
              NumAirTel: (Mots[3].split(':')[1]),
              NumTIGO: (Mots[4].split(':')[1]),
              NumMedecin: (Mots[4].split(':')[1]),
              Mode_Paie_OP: (Mots[1][5].split(':')[1]),
              Total_OP: (Mots[6].split(':')[1]),
              Remise_OP: (Mots[7].split(':')[1]),
              Dette_OP: (Mots[8].split(':')[1]),
              Jeton_OP: (Mots[9].split(':')[1]),
              isLaboratorized: (Mots[10].split(':')[1])
            }];
            updateList(newColonne)
          }
        }
        const ColonneChamp = new Array();
        for (var i = 1; i < RX_Lignes.length; i++) {
          RX_Col[i] = RX_Lignes[i].split(',');
          for (var j = 1; i < 11; i++) {
            alert(RX_Col);
          }
          //alert(RX_Col.length)
        }
    })
  })*/


//render(<App />, document.getElementById('root'));
