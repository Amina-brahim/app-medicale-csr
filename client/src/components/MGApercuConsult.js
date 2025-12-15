import React, { useEffect, useState, Component } from 'react';
import './style.css';

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
