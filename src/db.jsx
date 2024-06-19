function Db() {

    let imagesInDb = [];
    
    const dbName = "object_recognition";
    const tableName = "images";
    
    const dbInit = () => {
        const request = window.indexedDB.open(dbName);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          const objectStore = db.createObjectStore(tableName, {keyPath: "id", autoIncrement: true});
          objectStore.createIndex("image", "image", {unique: true});
        }
        request.onsuccess = (e) => {
          console.log("The database has been initialized");
        }
        request.onerror = (e) => {
          console.log("There has been an error the database", e);
        }}
    
      const dbAdd = (data) => {
        const request = window.indexedDB.open(dbName);
        request.onsuccess = (e) => {
          const db = e.target.result;
          const transaction = db.transaction([tableName], "readwrite");
          const objectStore = transaction.objectStore("images");
          const request = objectStore.add(data)
          request.onsuccess = (e) => {
            console.log("Data added successfully")
          }
          transaction.oncomplete = () => {
            db.close();
          }
        }
        request.onerror = (e) => {
          console.log('Error adding data', e);
        }
      }
      
    const dbRead = (id=null) => {
        // if Id is specified returns a specific item otherwise returns everything
        const request = window.indexedDB.open(dbName);
        request.onsuccess = (e) => {
        const db = e.target.result;
        const transaction = db.transaction([tableName], 'readonly');
        const objectStore = transaction.objectStore(tableName);
        const request = id === null ?
        objectStore.getAll()
        : objectStore.get(id)
        request.onsuccess = (e) => {
            if (request.result) {
            console.log('Data retrieved successfully', request.result);
            imagesInDb = [];
            imagesInDb.push(...request.result);
            } else {
            console.log('No data found for id', id);
            }
        };
        transaction.oncomplete = () => {
            db.close();
        }
        }
        request.onerror = (e) => {
        console.log('Error retrieving data', e);
        };
    }
    
    
    const dbUpdate = (data, id) => {
        const request = window.indexedDB.open(dbName);
        request.onsuccess = (e) => {
        const db = e.target.result;
        
        const transaction = db.transaction([tableName], 'readwrite');
        const objectStore = transaction.objectStore(tableName);
        const request = objectStore.put({id: id, ...data});
        request.onsuccess = (e) => {
            console.log('Data updated successfully');
        }
        transaction.oncomplete = () => {
            db.close();
        }
        }
        request.onerror = (e) => {
        console.log('Error updating data', e);
    }
    }
    
    const dbDelete = (id) => {
        const request = window.indexedDB.open(dbName);
        request.onsuccess = (e) => {
        const db = e.target.result;
        
        const transaction = db.transaction(tableName, 'readwrite');
        const objectStore = transaction.objectStore(tableName);
        const request = objectStore.delete(id)
        request.onsuccess = (e) => {
            console.log('Data deleted successfully');
        }
        transaction.oncomplete = () => {
            db.close();
        }
        }
        request.onerror = (e) => {
        console.log('Error deleting data', e);
    }


    }
    const getGallery = () =>{
        dbRead();
        return (imagesInDb);
    }
    return{
        dbInit,
        dbAdd,
        dbRead,
        dbUpdate,
        dbDelete,
        getGallery

    }
}

export default Db();