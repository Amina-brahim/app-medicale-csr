import React, { useState } from 'react';
import HexagonButton from './HexagonButton';

const toggleButtonForm = ({ socket }) => {
    const [isToggled, setIsToggled] = useState({
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

    const handleClick = () => {
        alert('Hexagon button clicked!');
    };

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
                                  
                                <HexagonButton onClick={handleClick}>
                                    Click Me
                                </HexagonButton>
       
    );
};

export default toggleButtonForm;
