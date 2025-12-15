import React, { useState } from 'react';


const CheckboxForm = ({ socket }) => {
    const [checkedItems, setCheckedItems] = useState({
        option1: false,
        option2: false,
        option3: false,
        valUree: false,
        valGlyc: false,
        valGlyc: false,
        valUree: false,
        valCreat: false,
        valBilirT: false,
        valBilirC: false,
        valBilirD: false,
        valASAT: false,
        valALAT: false,
        valGammaGT: false,
        valAmylase: false,
        valLipase: false,
        valAcideUrique: false,
        valCalcium: false,
        valMagnesium: false,
        valPhosphore: false,
        valCTT: false,
        valFerSerique: false,
        valProtidesT: false,
        valAlbumine: false,
        valAcideLactique: false,
        valCholesterolLDL: false,
        valCholesterolHDL: false,
        valTridlyceides: false,
        valCK: false,
        valCK_MB: false,
        valLDH: false,
        valTroponine: false,
        valD_Dimer: false,
        valAcidePhosphatase: false,
        valAlcalinePhosphatase: false
    });

    const handleChange = (event) => {
        const { name, checked } = event.target;
        setCheckedItems((prevState) => ({
          ...prevState,
          [name]: checked,
        }));
      };

    const handleSubmit = (event) => {
        event.preventDefault();
        //console.log('Checked Items:', checkedItems);
        // You can further process the checked items here.
    };
    const initialData = [
        { id: 0, value: "Pas de Clients" }
    ];

    const [list, updateList] = useState(initialData);


    const ListClients = ({ value, id, onRemoveClick }) => (
        <div className='list_row'>
            <label className='glow-on-hover_list flex-row'>{value}
                <span> | </span>
            </label>
            <button className='list_bouton' onClick={() => onRemoveClick(id)}>Terminé</button>
        </div>
    );

    const ListeClientsConsult = () => {

        const removeItem = id => {
            updateList(list.filter(item => item.id !== id));
        };

        return (
            <div className='global_list' >

                {list.map(item => (
                    <ListClients key={item.id}  {...item} onRemoveClick={removeItem} />
                ))}

            </div>
        );
    };

    return (
            <form className='form_margin ' onSubmit={handleSubmit}>
                <div className='flex-row'>
                    <div className='flex-column border_consult'>
                        { /*---------------------------------- Biochimie ---------------------------------- */}
                        <label className='titre_input'>Biochimie</label>
                        <div className='flex-row'>
                            <div className='largeur_200_consult espace_10R_consult border_consult'>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valGlyc" checked={checkedItems.valGlyc} onChange={handleChange} />
                                    <label className='titre_input'>Glycémie</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valUree" checked={checkedItems.valUree} onChange={handleChange} />
                                    <label className='titre_input'>Urée</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valCreat" checked={checkedItems.valCreat} onChange={handleChange} />
                                    <label className='titre_input'>Créatinine</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valBilirT" checked={checkedItems.valBilirT} onChange={handleChange} />
                                    <label className='titre_input'>Bilirubine T</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valBilirC" checked={checkedItems.valBilirC} onChange={handleChange} />
                                    <label className='titre_input'>Bilirubine C</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valBilirD" checked={checkedItems.valBilirD} onChange={handleChange} />
                                    <label className='titre_input'>Bilirubine D</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valASAT" checked={checkedItems.valASAT} onChange={handleChange} />
                                    <label className='titre_input'>ASAT</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valALAT" checked={checkedItems.valALAT} onChange={handleChange} />
                                    <label className='titre_input'>ALAT</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valGammaGT" checked={checkedItems.valGammaGT} onChange={handleChange} />
                                    <label className='titre_input'>Gamma GT</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valAmylase" checked={checkedItems.valAmylase} onChange={handleChange} />
                                    <label className='titre_input'>Amylase</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valLipase" checked={checkedItems.valLipase} onChange={handleChange} />
                                    <label className='titre_input'>Lipase</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valAcideUrique" checked={checkedItems.valAcideUrique} onChange={handleChange} />
                                    <label className='titre_input'>Acide Urique</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valCalcium" checked={checkedItems.valCalcium} onChange={handleChange} />
                                    <label className='titre_input'>Calcium</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valMagnesium" checked={checkedItems.valMagnesium} onChange={handleChange} />
                                    <label className='titre_input'>Magnésium</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valPhosphore" checked={checkedItems.valPhosphore} onChange={handleChange} />
                                    <label className='titre_input'>Phosphore</label>
                                </div>
                            </div>
                            <div className='largeur_200_consult border_consult'>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valCTT" checked={checkedItems.valCTT} onChange={handleChange} />
                                    <label className='titre_input'>CTT</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valFerSerique" checked={checkedItems.valFerSerique} onChange={handleChange} />
                                    <label className='titre_input'>Fer Sérique</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valProtidesT" checked={checkedItems.valProtidesT} onChange={handleChange} />
                                    <label className='titre_input'>Protides Totale</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valAlbumine" checked={checkedItems.valAlbumine} onChange={handleChange} />
                                    <label className='titre_input'>Albumine</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valAcideLactique" checked={checkedItems.valAcideLactique} onChange={handleChange} />
                                    <label className='titre_input'>Acie Lactique</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valCholesterolLDL" checked={checkedItems.valCholesterolLDL} onChange={handleChange} />
                                    <label className='titre_input'>Cholestérol LDL</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valCholesterolHDL" checked={checkedItems.valCholesterolHDL} onChange={handleChange} />
                                    <label className='titre_input'>Cholestérol HDL</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valTridlyceides" checked={checkedItems.valTridlyceides} onChange={handleChange} />
                                    <label className='titre_input'>Triglycérides</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valCK" checked={checkedItems.valCK} onChange={handleChange} />
                                    <label className='titre_input'>CK</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valCK_MB" checked={checkedItems.valCK_MB} onChange={handleChange} />
                                    <label className='titre_input'>CK-MB</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valLDH" checked={checkedItems.valLDH} onChange={handleChange} />
                                    <label className='titre_input'>LDH</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valTroponine" checked={checkedItems.valTroponine} onChange={handleChange} />
                                    <label className='titre_input'>Troponine</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valD_Dimer" checked={checkedItems.valD_Dimer} onChange={handleChange} />
                                    <label className='titre_input'>D-Dimer</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valAcidePhosphatase" checked={checkedItems.valAcidePhosphatase} onChange={handleChange} />
                                    <label className='titre_input'>Acide Phosphatase</label>
                                </div>
                                <div className='flex-row'>
                                    <input type="checkbox" name="valAlcalinePhosphatase" checked={checkedItems.valAlcalinePhosphatase} onChange={handleChange} />
                                    <label className='titre_input'>Alcaline Phosphat</label>
                                </div>
                            </div>
                        </div>
                        { /*---------------------------------- Biochimie ---------------------------------- */}
                    </div>


                    <div className='border_consult'>
                        <label className='titre_input'>Liste Clients</label>
                        <div className='liste_consult espace_10R_consult border_consult'>
                            <ListeClientsConsult />
                        </div>
                    </div>
                </div>

            </form>

    );
};

export default CheckboxForm;
