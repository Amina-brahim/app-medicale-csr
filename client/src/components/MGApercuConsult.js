import React, { useEffect, useState, Component } from 'react';
import './style.css';
import jsonString from '../databases/consult.json'; // Assuming the stringified JSON is stored here
import JsonToTable from './JsonToTable'
import TableComponent from './TableComponent';

const MGApercu = ({ socket }) => {
  
return (
  <TableComponent data={jsonString} />
);
      }
export default MGApercu;  
/*
<div>
<JsonToTable data={jsonString}/>
</div>
*/