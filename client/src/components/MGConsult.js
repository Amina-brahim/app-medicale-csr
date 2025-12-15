import React, { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom"
import LogoCsr from './images/logo_csr.png';
import SplashScreen from './SplashScreen';
import Modal_Biochimie from './Modal';
import Modal_Hematologie from './Modal';
import Modal_Coag from './Modal';
import Modal_Sero from './Modal';
import Modal_Para from './Modal';
import Modal_Hormo from './Modal';
import Modal_Marq from './Modal';
import Modal_Viro from './Modal';
import Modal_Iono from './Modal';
import Modal_Actes from './Modal';
import Modal_Imagerie from './Modal';
import HexagonButton from './HexagonButton';

const options = [
    { name: "En espèce", value: "espece" },
    { name: "Par Chèque", value: "cheque" },
    { name: "Par Virement", value: "virement" },
    { name: "Trénsfert AirTel", value: "transfert_airtel" },
    { name: "Trénsfert TIGO", value: "transfer_tigo" }
];
const initialData = [
    { id: 0, value: "Pas de Clients" }
];
const MG_Consult = ({ socket }) => {
    const navigate = useNavigate()
    const [errorMessages, setErrorMessages] = useState({});
    const [Client, setClient] = useState([]);
    const [NomClient, setNomClient] = useState("");
    const [Jeton_OP, setJetonOP] = useState("");
    const [IsLaboratorized, setIsLaboratorized] = useState(false);
    const [isChecked, setIsChecked] = useState(false);

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showDelayedText, setShowDelayedText] = useState(false);
    const [isSplashVisible, setSplashVisible] = useState(true);

    const handleSplashEnd = () => {
        setSplashVisible(false);
    };
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

    const errors = {
        uname: "Utilisateur Inconnu",
        pass: "Erreur sur Code d'accès"
    };

    useEffect(() => {
        socket.on("tache_labo", data => {
            //setValue([...newValue, data]);
            setValue(data);
            const newList = [...list, { id: list.length, value: data }];
            updateList(newList);
        });
    })

    const handleSubmit = (e) => {
        e.preventDefault();
        //console.log('Form data submitted:', formData);
        socket.emit("gpio", formData);

        handleCloseModal();

    };

    const renderErrorMessage = (name) =>
        name === errorMessages.name && (
            <div classname="message_erreur">{errorMessages.message}
            </div>
        );
    // -------------------------------------------------------------------------------------------------------------------
    const [isModalBiochimieOpen, setIsModalBiochimieOpen] = useState(false);
    const [isModalHematoOpen, setIsModalHematoOpen] = useState(false);
    const [isModalCoagOpen, setIsModalCoagOpen] = useState(false);
    const [isModalSeroOpen, setIsModalSeroOpen] = useState(false);
    const [isModalParaOpen, setIsModalParaOpen] = useState(false);
    const [isModalHormoOpen, setIsModalHormoOpen] = useState(false);
    const [isModalMarqOpen, setIsModalMarqOpen] = useState(false);
    const [isModalViroOpen, setIsModalViroOpen] = useState(false);
    const [isModalIonoOpen, setIsModalIonoOpen] = useState(false);
    const [isModalImagerieOpen, setIsModalImagerieOpen] = useState(false);
    const [isModalActesOpen, setIsModalActesOpen] = useState(false);

    /*const actes = [{ id: 1, name: "Hernie inguinale – adulte", type: "RA", montant: "600.000" },
    { id: 2, name: "Hydrocèle", type: "RA", montant: "500.000" },
    { id: 3, name: "Adenomectomie prostatique", type: "RA", montant: "800.000" },
    { id: 4, name: "Pulpectomie", type: "AL", montant: "300.000" },
    { id: 5, name: "Fracture de la Verge", type: "RA", montant: "700.000" },
    { id: 6, name: "Uretroplastie", type: "RA", montant: "900.000" },
    { id: 7, name: "Dilatation urétrale", type: "AL", montant: "100.000" },
    { id: 8, name: "Cysto-cathéter", type: "AL", montant: "100.000" },
    { id: 9, name: "Biopsie prostatique", type: "AL", montant: "100.000" },
    { id: 10, name: "Varicocèle unilatéral", type: "RA", montant: "400.000" },
    { id: 11, name: "Varicocèle bilatérale", type: "RA", montant: "800.000" },
    { id: 12, name: "Priapisme", type: "RA", montant: "600.000" },
    { id: 13, name: "Cystostomie", type: "RA", montant: "500.000" },
    { id: 14, name: "Cystolithotomie", type: "RA", montant: "500.000" },
    { id: 15, name: "Néphrostomie", type: "AL", montant: "400.000" },
    { id: 16, name: "Néphrectomie", type: "AG", montant: "100.0000" },
    { id: 17, name: "RTUP", type: "RA", montant: "100.0000" },
    { id: 18, name: "UIE", type: "RA", montant: "800.000" },
    { id: 19, name: "URS/Laser", type: "RA", montant: "1400.000" },
    { id: 20, name: "Néphrolithotomie", type: "RA", montant: "900.000" },
    { id: 21, name: "Lithoclaste (vessie)", type: "RA", montant: "900.000" },
    { id: 22, name: "Cystoscopie", type: "AL", montant: "100.000" },
    { id: 23, name: "Ablation sonde JJ", type: "Al", montant: "200.000" },
    { id: 24, name: "Dilatation uretrale", type: "AL", montant: "10000" },
    { id: 25, name: "pose sonde JJ", type: "AL", montant: "700.000" },
    { id: 26, name: "Sondage urinaire", type: "", montant: "15000" },
    { id: 27, name: "Circoncision", type: "AL", montant: "100.000" },
    { id: 28, name: "Lipome", type: "AL", montant: "200.000" },
    { id: 29, name: "Abcès", type: "AL", montant: "100.000" },
    { id: 30, name: "Réduction fracture + plâtre", type: "AL/AG", montant: "250000" },
    { id: 31, name: "AMOS", type: "AL", montant: "200.000" },
    { id: 32, name: "AMOS", type: "AG", montant: "300.000" },
    { id: 33, name: "Plâtre sans réduction", type: "Locale", montant: "150000" },
    { id: 34, name: "Suture de plaie sous AL", type: "AL/AG", montant: "50000" },
    { id: 35, name: "Ablation d’une TU cutanée sous AL", type: "AL/AG", montant: "100 000 – 200 000" },
    { id: 36, name: "Tout acte sous AL", type: "AL", montant: "100.000" },
    { id: 37, name: "Attèle pour PVBE, Genou recouvat", type: "AL/AG", montant: "100 000/ Séance" },
    { id: 38, name: "Hernie, Hydrocèle, Kyste cordon", type: "AG", montant: "500.000" },
    { id: 39, name: "Hernie ombilicale", type: "AG", montant: "500.000" },
    { id: 40, name: "Colostomie", type: "ALR", montant: "500.000" },
    { id: 41, name: "Rétablissement continuité", type: "ALR", montant: "600.000" },
    { id: 42, name: "Syndactylie", type: "ALR", montant: "200 000/ Rayon" },
    { id: 43, name: "Cryptorchidie", type: "ALR", montant: "700.000" },
    { id: 44, name: "Abaissement MAR", type: "AG", montant: "900.000" },
    { id: 45, name: "Abaissement Hirschsprung", type: "AG", montant: "1200.000" },
    { id: 46, name: "Ostéosynthèse", type: "AG", montant: "700.000" },
    { id: 47, name: "Appendicite", type: "AG", montant: "700.000" },
    { id: 48, name: "Fente faciale", type: "AG", montant: "900.000" },
    { id: 49, name: "Laparotomie", type: "AG", montant: "700.000" },
    { id: 50, name: "Fente palatine", type: "AG", montant: "700.000" },
    { id: 51, name: "Bistournage", type: "AG", montant: "600.000" },
    { id: 52, name: "Plastie tubaire", type: "AG", montant: "800.000" },
    { id: 53, name: "Myomectomie", type: "ALR", montant: "800.000" },
    { id: 54, name: "Hystérectomie voie Basse/voie haute", type: "ALR", montant: "800.000" },
    { id: 55, name: "Kystectomie", type: "ALR", montant: "800.000" },
    { id: 56, name: "Cerclage", type: "ALR", montant: "300.000" },
    { id: 57, name: "Césarienne prophylactique", type: "ALR", montant: "800.000" },
    { id: 58, name: "Césarienne interactive n°2 et plus", type: "ALR", montant: "800.000" },
    { id: 59, name: "Rupture utérine", type: "AG", montant: "900.000" },
    { id: 60, name: "Nodule du sein", type: "AG", montant: "300.000" },
    { id: 61, name: "Aspiration sans anesthésie", type: "AL/AG", montant: "200.000" },
    { id: 62, name: "Aspiration sous anesthésie", type: "ALR", montant: "300.000" },
    { id: 63, name: "Périnéorraphie", type: "ALR", montant: "400.000" },
    { id: 64, name: "Abcès : Sein/G Bartholin sous anesthésie", type: "ALR", montant: "400.000" },
    { id: 65, name: "Abcès : Sein/G Bartholin sans anesthésie", type: "ALR", montant: "400.000" },
    { id: 66, name: "Lipome", type: "ALR", montant: "500.000" },
    { id: 67, name: "Cystocèle", type: "ALR", montant: "500.000" },
    { id: 68, name: "Rectocèle", type: "ALR", montant: "500.000" },
    { id: 69, name: "Cystocèle plus Rectocèle", type: "ALR", montant: "800.000" },
    { id: 70, name: "Promonto-fixation", type: "ALR", montant: "800.000" },
    { id: 71, name: "Jadel", type: "", montant: "150000" },
    { id: 72, name: "Diapositive intra-uterin", type: "", montant: "150000" },
    { id: 73, name: "Examen sous valve", type: "", montant: "150000" },
    { id: 74, name: "Hydrotutation", type: "", montant: "150000" },
    { id: 75, name: "Réparation du périnée", type: "ALR", montant: "600.000" },
    { id: 76, name: "Accouchement normal", type: "", montant: "300.000" },
    { id: 77, name: "Accouchement dystocique", type: "", montant: "400.000" },
    { id: 78, name: "Maturation cervicale", type: "", montant: "150000" },
    { id: 79, name: "Aspiration MIUT", type: "", montant: "100.000" },
    { id: 80, name: "Promoto suspension", type: "ALR", montant: "800.000" },
    { id: 81, name: "Fibroscopie", type: "", montant: "50000" },
    { id: 82, name: "Rectoscopie", type: "", montant: "50000" },
    { id: 83, name: "Coloscopie", type: "", montant: "50000" },
    { id: 84, name: "ECG", type: "", montant: "15000" }];

    // ===========================================================
    // State for filtered items
    const [filter, setFilterActes] = useState("");
    const [collapsedCategories, setCollapsedCategories] = useState({});

    // Handle filter input change
    const handleFilterChange = (e) => {
        setFilterActes(e.target.value);
    };

    // Toggle collapse for a category
    const toggleCollapse = (category) => {
        setCollapsedCategories((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    // Filter items based on the input
    const filteredItems = actes.filter((item) =>
        item.name.toLowerCase().includes(filter.toLowerCase())
    );

    // Group items by category
    const groupedItems = filteredItems.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {});*/

    // ===========================================================
    const handleOpenModal = (e) => {
        if (e.target.id == "Biochimie") {
            setIsModalBiochimieOpen(!isModalBiochimieOpen);
        }
        if (e.target.id == "Hemato") {
            setIsModalHematoOpen(!isModalHematoOpen);
        }
        if (e.target.id == "Coag") {
            setIsModalCoagOpen(!isModalCoagOpen);
        }
        if (e.target.id == "Sero") {
            setIsModalSeroOpen(!isModalSeroOpen);
        }
        if (e.target.id == "Para") {
            setIsModalParaOpen(!isModalParaOpen);
        }
        if (e.target.id == "Hormo") {
            setIsModalHormoOpen(!isModalHormoOpen);
        }
        if (e.target.id == "Marq") {
            setIsModalMarqOpen(!isModalMarqOpen);
        }
        if (e.target.id == "Viro") {
            setIsModalViroOpen(!isModalViroOpen);
        }
        if (e.target.id == "Iono") {
            setIsModalIonoOpen(!isModalIonoOpen);
        }
        if (e.target.id == "Imagerie") {
            setIsModalImagerieOpen(!isModalImagerieOpen);
        }
        if (e.target.id == "Actes") {
            setIsModalActesOpen(!isModalActesOpen);
        }

    };

    const handleCloseModal = () => {
        setIsModalBiochimieOpen(false);
        setIsModalHematoOpen(false);
        setIsModalCoagOpen(false);
        setIsModalSeroOpen(false);
        setIsModalParaOpen(false);
        setIsModalHormoOpen(false);
        setIsModalMarqOpen(false);
        setIsModalViroOpen(false);
        setIsModalIonoOpen(false);
        setIsModalImagerieOpen(false);
        setIsModalActesOpen(false);

    };

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
    
    // -------------------------------------------------------------------------------------------------------------------
    return (
        <>
            <div classname="entete TC">
                <div classNamme="marges_logo_5px">
                    <img class='logo_clinique marges_logo_5px' src={LogoCsr} alt="Tchad" id="logoIred" />
                </div>
                <div classname='titre_entete'>
                    <h2 classname='titre_entete'>CSR - N'Djamena - TCHAD</h2>
                    <h3 classname='sous_titre_entete'>Salle de Consultations N°3</h3>
                    <br></br>
                    <br></br>
                </div>
            </div>

            <div>
                <form classname='ftt__footer BC flex-column'>
                    <div classname='flex-row center'>
                        <button classname="glow-on-hover_Consult  MenuBtn" onClick={handleOpenModal} type="button" id='Biochimie'>Biochimie</button>
                        <button classname="glow-on-hover_Consult  MenuBtn" onClick={handleOpenModal} type="button" id='Hemato'>Hématologie</button>
                        <button classname="glow-on-hover_Consult  MenuBtn" onClick={handleOpenModal} type="button" id='Coag'>Coagulation</button>
                        <button classname="glow-on-hover_Consult  MenuBtn" onClick={handleOpenModal} type="button" id='Sero'>Sérologie</button>
                        <button classname="glow-on-hover_Consult  MenuBtn" onClick={handleOpenModal} type="button" id='Para'>Parasitologie</button>
                    </div>
                    <div classname='flex-row center'>
                        <button classname="glow-on-hover_Consult  MenuBtn" onClick={handleOpenModal} type="button" id='Hormo'>Hormones</button>
                        <button classname="glow-on-hover_Consult  MenuBtn" onClick={handleOpenModal} type="button" id='Marq'>Marqueurs</button>
                        <button classname="glow-on-hover_Consult  MenuBtn" onClick={handleOpenModal} type="button" id='Viro'>Virologie</button>
                        <button classname="glow-on-hover_Consult  MenuBtn" onClick={handleOpenModal} type="button" id='Iono'>Ionogrammes</button>
                        <button classname="glow-on-hover_Consult  MenuBtn" onClick={handleOpenModal} type="button" id='Imagerie'>Imagerie</button>
                    </div>
                    <div classname='flex-row center'>
                        <button classname="glow-on-hover_Consult  MenuBtn" onClick={handleOpenModal} type="button" id='Actes'>Actes Chirurgicaux</button>
                        <button classname="glow-on-hover_Consult  MenuBtn" onClick={handleOpenModal} type="button" id='Retour'>Retour</button>
                        <button classname="glow-on-hover_Consult  MenuBtn" onClick={handleOpenModal} type="button" id='Aide'>Aide / Assistance</button>
                    </div>
                </form>
            </div>
        </>
    )
}

export default MG_Consult
