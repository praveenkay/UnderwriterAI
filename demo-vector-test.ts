// Demo script to test vector functionality
import { vectorStoreService } from './server/services/vectorStore';
import fs from 'fs';

async function demoVectorSearch() {
  console.log('=== Vector Search Demo ===');
  
  // Initialize the vector store
  await vectorStoreService.initialize();
  
  // Sample documents to ingest
  const documents = [
    {
      content: "Restaurant businesses are eligible for equipment upgrade discount: 7% if kitchen equipment modernized. Safety certification discount: 8% for fire safety compliance. Staff training discount: 5% for food safety training completion.",
      filename: "restaurant_discounts.txt",
      metadata: { type: "guideline", topic: "restaurant_discounts" }
    },
    {
      content: "For clients with clean claims history (no claims in past 2 years): Standard renewal discount: 10%. Loyalty discount (3+ years): Additional 5%. Risk profile improvement: Additional 2-5%.",
      filename: "loyalty_discounts.txt", 
      metadata: { type: "guideline", topic: "loyalty_discounts" }
    },
    {
      content: "Bella's Bistro renewal case: 4-year customer, kitchen equipment upgraded, fire safety training completed. Eligible for equipment upgrade discount 7% and safety certification discount 8%. Total discount: 15%.",
      filename: "bellas_bistro_case.txt",
      metadata: { type: "case_study", topic: "restaurant_renewal" }
    }
  ];
  
  // Create temporary files and ingest them
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const tempFile = `./temp_${i}.txt`;
    
    // Write content to temporary file
    fs.writeFileSync(tempFile, doc.content);
    
    // Ingest into vector store
    const result = await vectorStoreService.ingestDocument(
      tempFile,
      doc.filename,
      'text/plain',
      {
        documentId: i + 1,
        brokerId: 'demo_broker',
        brokerName: 'Demo Broker',
        uploadDate: new Date().toISOString(),
        ...doc.metadata
      }
    );
    
    console.log(`Ingested ${doc.filename}: ${result.chunks} chunks, success: ${result.success}`);
    
    // Clean up temp file
    fs.unlinkSync(tempFile);
  }
  
  // Test various searches
  const searches = [
    "restaurant equipment upgrade discount",
    "loyalty discount for long-term customers", 
    "Bella's Bistro case study",
    "fire safety certification",
    "kitchen modernization benefits"
  ];
  
  console.log('\n=== Search Results ===');
  
  for (const query of searches) {
    console.log(`\nQuery: "${query}"`);
    const results = await vectorStoreService.searchSimilar(query, 3);
    
    if (results.length === 0) {
      console.log('  No results found');
    } else {
      results.forEach((result, idx) => {
        const score = result.score ? (result.score * 100).toFixed(1) : 'N/A';
        console.log(`  ${idx + 1}. [${score}%] ${result.content.substring(0, 80)}...`);
        console.log(`     Source: ${result.metadata.source || 'Unknown'}`);
      });
    }
  }
  
  // Get final stats
  const stats = await vectorStoreService.getDocumentStats();
  console.log('\n=== Vector Store Stats ===');
  console.log(`Total documents: ${stats.totalDocuments}`);
  console.log(`Sources: ${stats.sources.join(', ')}`);
  console.log(`Last update: ${stats.lastUpdate}`);
  
  console.log('\n=== Demo Complete ===');
}

// Run the demo
demoVectorSearch().catch(console.error);