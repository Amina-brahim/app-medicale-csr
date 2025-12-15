const express = require("express")
const app = express()
const cors = require("cors")
const http = require('http').Server(app);
const PORT = 4500
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const nomFichierLabo        = '/home/synaptics/Essais/Projet_Caisse/src/components/labo.json';
const nomFichierConsult     = '/home/synaptics/Essais/Projet_Caisse/src/components/consult.json';

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

const socketIO = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH']
    }
});

app.use(cors())
let users = [];
let Clients = [];

let data = fs.readFileSync(nomFichierLabo);
if (null === data){
    Clients = JSON.parse(data);
}

socketIO.on('connection', (socket) => {
    socket.on("journal", rXJournal => {
        //socketIO.emit("rxJournal");
        fs.readFile(nomFichierLabo, 'utf8', (err, jsonString) => {
          //console.log(jsonString);
          if (err) {
            return;
          }
    
          try {
            const customer = JSON.parse(jsonString);
            socketIO.emit("rxJournal", (customer));
            console.log(customer);
            //console.log(JSON.parse(JSON.stringify(customer)));
          } catch (err) {
            console.log('Error parsing JSON string:', err);
          }
        })
    })

    socket.on("maj", rXJournal => {
        socketIO.emit("update");
    })

    socket.on("consult", srConsult => {
        //console.log(srData);
        //-----------------------------------------------
        Clients.push(srConsult);

        // Step 2: Convert the object to a JSON string
        const jsonConsult = JSON.stringify(Clients, null, 2); // The `null` and `2` are for pretty-printing

        // Step 3: Write the JSON string to a file
        fs.writeFile(nomFichierConsult, jsonConsult, (err) => {
            if (err) {
                console.error('Error writing to file', err);
            } else {
                console.log('JSON data has been written to data.json');
            }
        });

        let tmpConsult = JSON.stringify(srConsult);
        tmpConsult = tmpConsult.split(',')[0];
        tmpConsult = tmpConsult.split(':')[1]
        socketIO.emit("tache_Consult", tmpConsult);

        console.log(jsonConsult);
    })

    socket.on("labo", srData => {
        //console.log(srData);
        //-----------------------------------------------
        Clients.push(srData);
        let dataToLabo = [];

        // Step 2: Convert the object to a JSON string
        const jsonData = JSON.stringify(Clients, null, 2); // The `null` and `2` are for pretty-printing

        // Step 3: Write the JSON string to a file
        fs.writeFile(nomFichierLabo, jsonData, (err) => {
            if (err) {
                console.error('Erreur écriture Fichier Base de Données', err);
            } else {
                console.log('Le Client a bien été enregistré');
            }
        });

        let tmpNom = JSON.stringify(srData);
        tmpNom = tmpNom.split(',')[0];
        tmpNom = tmpNom.split(':')[1]
        dataToLabo.push(tmpNom);
        let tmpID = JSON.stringify(srData);
        tmpID = tmpID.split(',')[1];
        tmpID = tmpID.split(':')[1]
        dataToLabo.push(tmpID);
        socketIO.emit("tache_labo", dataToLabo);

        console.log(dataToLabo);
    })

    socket.on("updateFinished", updateCSRID => {
        /*let tmpNom = JSON.stringify(srData);
        tmpNom = tmpNom.split(',')[0];
        tmpNom = tmpNom.split(':')[1]*/
        console.log(updateCSRID);
        /*fs.readFile('data.json', 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading the file:', err);
                return;
            }
    
            // Parse the JSON data
            let records = JSON.parse(data);
            
            // Find the index of the record to update
            const index = records.findIndex(record => record.id === id);
            if (index === -1) {
                console.log('Record not found');
                return;
            }
    
            // Update the record
            records[index] = { ...records[index], ...updatedData };
    
            // Write the updated records back to the JSON file
            fs.writeFile('data.json', JSON.stringify(records, null, 2), (err) => {
                if (err) {
                    console.error('Error writing the file:', err);
                    return;
                }
                console.log('Record updated successfully');
            });
        });*/

    })


    socket.on("newUser", NouvelUtilisateur => {
        console.log(`⚡: L\'ustilisateur dont l\'identifiant ${socket.id} de CSR s'est connecté `)
        users.push(NouvelUtilisateur)
    })

    socket.on('disconnect', () => {
        console.log(`⚡: L\'ustilisateur dont l\'identifiant ${socket.id} s\'est Déconnecté`);
        users = users.filter(user => user.socketID !== socket.id)
        //socketIO.emit("newUserResponse", users)
        socket.disconnect()
    });
})

app.get('/api', (req, res) => {
    res.json(messagesData);
});

http.listen(PORT, () => {
    console.log(`Serveur à l'écoute au  ${PORT}`);
});


