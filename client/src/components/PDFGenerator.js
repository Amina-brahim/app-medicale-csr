import React from 'react';
import { usePDF } from 'react-to-pdf';
import { Page, Text, View, Document, StyleSheet, PDFViewer } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 15,
    borderBottom: '1 solid #e0e0e0',
    paddingBottom: 10
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666'
  },
  section: {
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    backgroundColor: '#f5f5f5',
    padding: 3
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3
  },
  label: {
    width: '40%',
    fontSize: 9,
    fontWeight: 'bold'
  },
  value: {
    width: '60%',
    fontSize: 9
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: '#999'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 5,
    borderBottom: '1 solid #ddd'
  },
  tableRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottom: '1 solid #eee'
  },
  col1: {
    width: '30%',
    fontSize: 8
  },
  col2: {
    width: '70%',
    fontSize: 8
  }
});

const PDFDocument = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>FICHE DE PATIENT - LABORATOIRE</Text>
        <Text style={styles.subtitle}>Jeton: {data.jeton_OP} | Date: {new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INFORMATIONS CLIENT</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>ID Patient:</Text>
          <Text style={styles.value}>{data.id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Nom Client:</Text>
          <Text style={styles.value}>{data.nomClient}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Numéro CSR:</Text>
          <Text style={styles.value}>{data.numID_CSR}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Téléphones:</Text>
          <Text style={styles.value}>
            Airtel: {data.numAirTel} | Tigo: {data.numTIGO}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INFORMATIONS MEDICALES</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Médecin traitant:</Text>
          <Text style={styles.value}>{data.numMedecin}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Service:</Text>
          <Text style={styles.value}>{data.service}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Assurance:</Text>
          <Text style={styles.value}>{data.assure}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Laboratorisé:</Text>
          <Text style={styles.value}>{data.isLaboratorized}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INFORMATIONS FINANCIÈRES</Text>
        
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Mode de paiement</Text>
          <Text style={styles.col2}>{data.mode_Paie_OP}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.col1}>Total à payer</Text>
          <Text style={styles.col2}>{data.total_OP}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.col1}>Remise appliquée</Text>
          <Text style={styles.col2}>{data.remise_OP}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.col1}>Dette</Text>
          <Text style={styles.col2}>{data.dette_OP}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text>Document généré automatiquement - Merci pour votre confiance</Text>
      </View>
    </Page>
  </Document>
);

const PDFGenerator = ({ data }) => {
  const { toPDF, targetRef } = usePDF({ 
    filename: `fiche-patient-${data.id}.pdf` 
  });

  return (
    <div style={{ margin: '20px 0' }}>
      <button 
        onClick={() => toPDF()} 
        style={{
          padding: '8px 15px',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          marginBottom: 10,
          fontSize: 14
        }}
      >
        Exporter en PDF
      </button>

      <div ref={targetRef} style={{ border: '1px solid #eee', padding: 15 }}>
        <PDFViewer width="100%" height="600px">
          <PDFDocument data={data} />
        </PDFViewer>
      </div>
    </div>
  );
};

export default PDFGenerator;