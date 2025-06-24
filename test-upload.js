// Quick test to verify document upload works
import fs from 'fs';

const testUpload = async () => {
  try {
    const formData = new FormData();
    const testContent = "This is a test document for underwriting rules extraction. Policy POL001 requires renewal review with 5% discount for loyal customers.";
    
    // Create a simple test file
    const blob = new Blob([testContent], { type: 'text/plain' });
    formData.append('file', blob, 'test-document.txt');
    formData.append('fileType', 'guideline');

    const response = await fetch('http://localhost:5000/api/documents/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    console.log('Upload result:', result);
    
    // Test getting documents
    const docsResponse = await fetch('http://localhost:5000/api/documents');
    const docs = await docsResponse.json();
    console.log('Documents:', docs);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testUpload();