// ... existing code ...

    // Replace bulkCreate with individual upsert operations
    for (const bomData of processedData) {
      try {
        await Bom.upsert(bomData, {
          returning: true,
          conflictFields: ['bom_kodu'] // Handle conflicts on bom_kodu
        });
      } catch (error) {
        console.error(`Error upserting BOM ${bomData.bom_kodu}:`, error.message);
      }
    }

    console.log(`${processedData.length} BOM kaydı işlendi (eklendi veya güncellendi).`);
// ... existing code ...