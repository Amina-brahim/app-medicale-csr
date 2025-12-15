// src/FloatingList.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"
import LogoCsr from './images/logo_csr.png';
import "./FloatingList.css";

const FloatingComponent = ({ socket }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
    // =============================================================================
    const initialData = [
        { id: 0, value: "Aucune Tache à faire" }
    ];
    const navigate = useNavigate()
    const [errorMessages, setErrorMessages] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showDelayedText, setShowDelayedText] = useState(false);

    const [nomClient, setNomClient] = useState("");
    const [newValue, setValue] = useState("");
    const [list, updateList] = useState(initialData);
    const errors = {
        uname: "Utilisateur Inconnu",
        pass: "Erreur sur Code d'accès"
    };
    // =============================================================================
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setInitialPosition({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - initialPosition.x,
                y: e.clientY - initialPosition.y,
            });
        }
    };

    function sirAcceuil() {
        navigate("/PageAcceuil");
    }

    // =============================================================================
    // User Login info
    const database = [
        {
            username: "Chouaib",
            password: "SansPasse"
        },
        {
            username: "Djibrine",
            password: "SansPasse"
        },
        {
            username: "Labo",
            password: "SansPasse"
        }
    ];

    const handleLogin = (event) => {
        //Prevent page reload
        event.preventDefault();

        var { uname, pass } = document.forms[0];

        // Find user login info
        const userData = database.find((user) => user.username === uname.value);

        // Compare user info
        if (userData) {
            if (userData.password !== pass.value) {
                // Invalid password
                setErrorMessages({ name: "pass", message: errors.pass });
            } else {
                setIsSubmitted(true);
            }
        } else {
            // Username not found
            setErrorMessages({ name: "uname", message: errors.uname });
        }

        setTimeout(() => {
            setShowDelayedText(true);
        }, 2000);
    };

    const renderErrorMessage = (name) =>
        name === errorMessages.name && (
            <div className="message_erreur">{errorMessages.message}
            </div>
        );

    const renderForm = (
        <div className="form">
            <form className='form_margin BC' onSubmit={handleLogin}>

                <br></br>
                <br></br>

                <label className='sous_titre'>Utilisateur </label>
                <input className='utilisateur_interne' minLength={4} type="text" name="uname" required />
                {renderErrorMessage("uname")}

                <label className='sous_titre'>Code d'accès</label>
                <input className='utilisateur_interne' minLength={8} type="password" name="pass" required />
                {renderErrorMessage("pass")}

                <div className='ftt__footer BC'>
                    <button className='home__cta'>Connexion</button>
                </div>


            </form>
        </div>
    );

    // =======================================================================

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging]);

    const ListItem = ({ value, id, onRemoveClick }) => (
        <div className='list_row'>
            <label className='client_in_list flex-row'>{value}
                <span> | </span>
            </label>
            <button className='list_bouton' onClick={() => onRemoveClick(id)}>Terminé</button>
        </div>
    );
    // =======================================================================

    /*function addItem ()  {
      const newList = [...list,{ id: list.length , value: newValue }];
      updateList(newList);
      };*/
    // =======================================================================

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
    useEffect(() => {
        socket.on("tache_labo", data => {
          //setValue([...newValue, data]);
          //alert(data)
          setValue(data);
          const newList = [...list, { id: list.length, value: data }];
          updateList(newList);
        });
      })
    return (

        <div
            className="floating-component"
            style={{
                left: position.x,
                top: position.y,
                position: "absolute",
                cursor: isDragging ? "grabbing" : "grab",
            }}
            onMouseDown={handleMouseDown}
        >

            <div className="entete TC">
                <div className='titre_entete'>
                    <h2 className='titre_entete'>CSR - N'Djamena - TCHAD</h2>
                    <h3 className='sous_titre_entete'>Laboratoire d'Analyses Médicale</h3>
                    <br></br>
                    <br></br>
                    <h2 className='sous_titre_entete'>File des travaux techniques</h2>

                </div>
            </div>
            {isSubmitted ? <div>
                <div>
                    <div >
                        <ListExample />
                    </div>

                    <div className="Labo__footer BC">
                        <button className="glow-on-hover_bouton_Labo" type="button" onClick={sirAcceuil} id='Lyo1' >Fin Session</button>
                    </div>
                </div>
            </div> : renderForm}

        </div>
    );
};

export default FloatingComponent;