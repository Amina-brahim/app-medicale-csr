import React, { Component } from 'react';
import { render } from 'react-dom';
import Hello from './Hello';
import './style.css';

class receipt extends Component {
  constructor() {
    super();
    this.state = {
      name: 'Caisse CSR'
    };

  }
  printReceipt() {
    window.print();
  }

  render() {
    return (
      <div>
        <table class="print-receipt">
        <Hello name={this.state.name} />
        <br></br>        <br></br>
        <br></br>

          <tr>
            <th>Désignation  <span>          </span> </th>
            <th>Prix /Uté<br></br>  FCFA</th>
            <th>Total</th>
          </tr>
          <tr>
            <td>NFS</td>
            <td>7.000</td>
            <td>7.000</td>
          </tr>
          <tr>
            <td>VIDAL</td>
            <td>3.000</td>
            <td>3.000</td>
          </tr>
          <tr>
            <td>G.E</td>
            <td>3.000</td>
            <td>3.000</td>
          </tr>
        </table>
        <button class="glow-on-hover_bouton hide-on-print" onClick={this.printReceipt}>Imprimer</button>
      </div>
    );
  }
}

export default receipt;

//render(<App />, document.getElementById('root'));