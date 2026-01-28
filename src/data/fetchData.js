const globals = {

    CRYPTOKEY: process.env.REACT_APP_CRYPTO_KEY,

    "cs_ai_olympus_create_user_secret": process.env.REACT_APP_CS_AI_OLYMPUS_CREATE_USER_TOKEN,
    "cs_ai_olympus_ticket_tamer_config_saver_secret": process.env.REACT_APP_CS_AI_OLYMPUS_TICKET_TAMER_CONFIG_SAVER_TOKEN,
    "cs_ai_olympus_ticket_tamer_report_finisher_secret": process.env.REACT_APP_CS_AI_OLYMPUS_TICKET_TAMER_REPORT_FINISHER_TOKEN,
    "cs_ai_olympus_ticket_tamer_secret": process.env.REACT_APP_CS_AI_OLYMPUS_TICKET_TAMER_TOKEN,
    "cs_ai_cors_handler_for_sheet_creation_secret": process.env.REACT_APP_CS_AI_CORS_HANDLER_FOR_SHEET_CREATION_TOKEN,
    "cs_ai_backlog_calculator_secret": process.env.REACT_APP_CS_AI_BACKLOG_CALCULATOR_TOKEN,
    "cs_ai_olympus_ticket_tamer_cost_calculator_secret": process.env.REACT_APP_CS_AI_OLYMPUS_TICKET_TAMER_COST_CALCULATOR_TOKEN,
    "cs_ai_olympus_ticket_tamer_process_ai_secret": process.env.REACT_APP_CS_AI_OLYMPUS_TICKET_TAMER_PROCESS_AI_TOKEN,
    "cs_ai_escalations_statistics_secret": process.env.REACT_APP_CS_AI_ESCALATIONS_STATISTICS_TOKEN,
    "cs_ai_olympus_sheet_writter_secret": process.env.REACT_APP_CS_AI_OLYMPUS_SHEET_WRITTER_TOKEN,
    "cs_ai_olympus_assign_user_secret": process.env.REACT_APP_CS_AI_OLYMPUS_ASSIGN_USER_TOKEN,
    "cs_ai_olympus_ticket_tamer_buffer_deleter_secret": process.env.REACT_APP_CS_AI_OLYMPUS_TICKET_TAMER_BUFFER_DELETER_TOKEN,
    "cs_ai_cors_bypasser_sheets_cloner_secret": process.env.REACT_APP_CS_AI_CORS_BYPASSER_SHEETS_CLONER_TOKEN,
    "cs_ai_olympus_loading_bar_calculator_secret": process.env.REACT_APP_CS_AI_OLYMPUS_LOADING_BAR_CALCULATOR_TOKEN,

    OLYMPUS_KEY: process.env.REACT_APP_OLYMPUS_KEY,
    CRYPTO_KEY: process.env.REACT_APP_CRYPTO_KEY,

};

// console.log(`globals = ${JSON.stringify(globals, null, 2)}`);

const sleep = (milliseconds) => { return new Promise(resolve => setTimeout(resolve, milliseconds)) };

function encryptSecret(secret) {
    const timestamp = Math.floor(Date.now() / 1000).toString(); // Current UNIX timestamp
    const combinedData = secret + "|" + timestamp; // Combine secret and timestamp
    
    let encrypted = "";
    for (let i = 0; i < combinedData.length; i++) {
        encrypted += String.fromCharCode(combinedData.charCodeAt(i) ^ globals.CRYPTOKEY.charCodeAt(i % globals.CRYPTOKEY.length));
    }

    return btoa(encrypted); // Encode in Base64
};

export const performFetchLastData = async (globals) => {
  
    try {
        await sleep(500); // Pausa de 1 segundo entre solicitudes
        let response = await fetch(`https://${globals.SHEET_API_URL}/${globals.SHEET_ID}?key=${globals.SHEET_KEY}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });

        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        let data = await response.json();

        let tabNames = data.sheets.map(sheet => sheet.properties.title);
        tabNames = tabNames.filter(tab => tab.includes('Sheet')); 
        let mostRecentTab = findMostRecentTab(tabNames);
        const encodedTab = encodeURIComponent(mostRecentTab);
        // console.log(`mostRecentTab = ${mostRecentTab} (${encodedTab})`); 

        await sleep(500); // Pausa de 1 segundo entre solicitudes
        response = await fetch(`https://${globals.SHEET_API_URL}/${globals.SHEET_ID}/values/${encodedTab}!${globals.SHEET_RANGE}?key=${globals.SHEET_KEY}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });

        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        data = await response.json();

        return data;

    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};

export const performFetchLastStats = async (globals) => {
    try {
        const url = `https://${globals.SHEET_API_URL}/${globals.SHEET_ID}/values/Stats!${globals.SHEET_RANGE}?key=${globals.SHEET_KEY}`;

        let params = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json'},
            cache: 'no-store'
        };

        await sleep(500); // Pausa de 1 segundo entre solicitudes
        const response = await fetch(url, params);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let data = (await response.json()).values;
        data = data.slice(1); //delete the headers
        let lastItem = data[data.length-1];

        let info = {
            "date_refreshed": lastItem[0],
            "total_tickets": lastItem[1],
            "new": lastItem[2],
            "open": lastItem[3],
            "pending": lastItem[4],
            "onhold": lastItem[5],
            "solved": lastItem[6],
            "closed": lastItem[7],
            "urgent": lastItem[8],
            "high": lastItem[9],
            "normal": lastItem[10],
            "low": lastItem[11],
        }

        return info;

    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};

export const performFetchFullStats = async (globals) => {
    try {
        const url = `https://${globals.SHEET_API_URL}/${globals.SHEET_ID}/values/Stats!${globals.SHEET_RANGE}?key=${globals.SHEET_KEY}`;

        let params = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json'},
            cache: 'no-store'
        };

        await sleep(500); // Pausa de 1 segundo entre solicitudes
        const response = await fetch(url, params);
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        let data = (await response.json()).values;
        return data;
    } catch (error) {
        console.error('Error fetching performFetchFullStats:', error);
        throw error;
    }
};

//let productList = localStorage.getItem(`product-list`);

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/

export const fetchProducts = async () => {
    
    try {
      const url = `https://idli2os7tfa26qvj6berh7whxi0htujt.lambda-url.us-east-1.on.aws`; // cs-ai-olympus-config-calculator

      let params = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({
          tab: "PRODUCTS"
        }),
        cache: 'no-store'
      };
  
      const response = await fetch(url, params);

      if (!response.ok) { 
        throw new Error(`HTTP error! status: ${response.status}`); 
      }
  
      const data = await response.json();
      return data.values;

    } catch (error) {
      console.error('Error fetching assignments:', error);
      return null;
    }
};

// src/data/fetchData.js
export const fetchModels = async (opts = {}) => {
    const LS_KEY = "ai-models";        
    const url = `https://sheets.googleapis.com/v4/spreadsheets/11W21HKGz7oo_sCn3inX6LbrCGq7tjkug_hUG0Y3EN48/values/AIModels!A1:C?key=AIzaSyCO8yb8FFHwAbaJR6YmfQXKgZxkGEQjk5A`;
  
    let params = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json'},
      cache: 'no-store'
    };

    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached?.values) {
          return cached.values;
        }
      }
    } catch (e) {
      console.warn("Cache read failed (ignored):", e);
    }

    try {
      const response = await fetch(url, params);
  
      if (response.status === 429) { 
        alert("You've made too many requests. Please wait and try again later.");
        // si hay cache viejo, úsalo como fallback
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
          try { return JSON.parse(raw)?.values ?? null; } catch(_) {}
        }
        return null; 
      }
  
      if (!response.ok) { 
        throw new Error(`HTTP error! status: ${response.status}`); 
      }
  
      const data = await response.json();

      try {
        localStorage.setItem(LS_KEY, JSON.stringify({
          ts: Date.now(),      // timestamp para expiración
          values: data.values, // el arreglo que necesitas
        }));
      } catch (e) {
        console.warn("Cache write failed (ignored):", e);
      }
  
      return data.values;
  
    } catch (error) {
      console.error('Error fetching assignments:', error);

      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          if (cached?.values) return cached.values;
        }
      } catch (e) {
        console.warn("Cache read failed (ignored):", e);
      }
  
      return null;
    }
};

export const saveProductNames = async () => {
    let productList = localStorage.getItem(`product-list`);

    if (!productList) {
        const productNames = await fetchProducts();
        localStorage.setItem(`product-list`, JSON.stringify(productNames));
    }

};

export const getProductRealName = (productID) => {
    const list = JSON.parse(localStorage.getItem('product-list')) || [];
    const product = list.find(item => item[0] === productID); //Product ID es el cero, Product Name es el uno
    return product ? product[1] : 'missing';
};

export const getProductID = (productRealName) => {
    const list = JSON.parse(localStorage.getItem('product-list')) || [];
    const product = list.find(item => item[1] === productRealName); //Product ID es el cero, Product Name es el uno
    return product ? product[0] : 'missing';
};

export const convertDataToArray = (data) => {
    const header = ["ticket_id", "priority", "ai_tags", "sla", "fcr", "date_closed", "date_refreshed", "time_spent_in_open", "time_spent_in_pending", "time_spent_in_hold", "time_spent_in_solved", "time_spent_open_l1", "time_spent_open_l2", "initial_response_time", "resolution_time"];
    
    const rows = data.map(item => [
      item.ticket_id.toString(),
      item.priority,
      item.ai_tags.toString(),
      item.sla.toString(),
      item.fcr.toString(),
      item.date_closed,
      item.date_refreshed,
      item.time_spent_in_open,
      item.time_spent_in_pending,
      item.time_spent_in_hold,
      item.time_spent_in_solved,
      item.time_spent_open_l1,
      item.time_spent_open_l2,
      item.initial_response_time,
      item.resolution_time,
    ]);

    return [header, ...rows];
};

export const performGetTotalsAll = async (globals) => {
    
    saveProductNames();
    fetchUsers();
    const BUCKET_NAME = `olympus-cache`;
  
    try {
      const storageKey = `performGetTotalsAll-${globals.SHEET_ID}`;
      const cachedData = localStorage.getItem(storageKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
  
      let data;
      let title = '';
  
      if (globals.SHEET_ID === "CUSTOM") {
        let datesChosen = localStorage.getItem(`datesChoosen`);
        datesChosen = datesChosen.split(`***`);
        const [fromDate, toDate] = datesChosen;
  
        const url = `https://kmrhqhfcuz5vgkus7zm47kfnye0csjkr.lambda-url.us-east-1.on.aws/`;
        const params = {
          sheets_id: "none",
          product_id: "all",
          from: fromDate,
          to: toDate
        };
        const options = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
          cache: 'no-store'
        };
  
        console.log(
          `Requesting information for ${params.product_id} ` +
          `(from ${params.from} to ${params.to}). This may take a few minutes...`
        );
        const startTime = Date.now();
  
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        data = (await response.json()).message;
  
        const elapsed = Date.now() - startTime;
        console.log(
          `Done: ${data.length - 1} rows (incl. header). ` +
          `Elapsed ${Math.floor(elapsed/1000)}s ${elapsed%1000}ms.`
        );
  
      } else {

        const bucketUrl = `https://${BUCKET_NAME}.s3.amazonaws.com`;
        const prefix = globals.SHEET_ID;
        const totalUrl = `${bucketUrl}/${prefix}/Total.json`;
        console.log(`[performGetTotalsAll] fetching data from S3 ${totalUrl}`);

        let resp = await fetch(totalUrl, { cache: 'no-store' });
        if (!resp.ok) {
          throw new Error(`Could not fetch Total.json: ${resp.status}`);
        }
        const totalJson = await resp.json();
        data = totalJson.values; 

        const metaUrl = `${bucketUrl}/${prefix}/0-metadata.txt`;
        console.log(`[performGetTotalsAll] fetching data from S3 ${metaUrl}`);
        const metaResp = await fetch(metaUrl, { cache: 'no-store' });
        if (metaResp.ok) {
          const metaText = await metaResp.text();
          console.log(`[performGetTotalsAll] metadata.txt = ${metaText}`);
          // metadata.txt contiene: "Execution finished at: MM/DD/YYYY hh:mm:ss.xxx"
          const [, timestamp] = metaText.split('Execution finished at: ');
          title = timestamp.trim(); 
        }

        let keyName = '';
        if (globals.SHEET_ID === `1I5cdCL3k_h25DGzySpkQQuqsn0Rbuv-KafEEtVCgj3E`) keyName = `last-update-4w`;
        if (globals.SHEET_ID === `1zUZJJsqkKfs9Fu4gx5tOW9m216Kft5ucdoutcY02LEM`) keyName = `last-update-1w`;
        if (globals.SHEET_ID === `1j1SCJrBrYb8Dx5l6QkMB9SX7WMkV_ZzSZOCxs3Tm6Os`) keyName = `last-update-1d`;
        if (title) {
          localStorage.setItem(keyName, title);
        }
      }

      localStorage.setItem(storageKey, JSON.stringify(data));

      if (globals.SHEET_ID === "1I5cdCL3k_h25DGzySpkQQuqsn0Rbuv-KafEEtVCgj3E") {
        const productsData = localStorage.getItem("bu-product");
        if (!productsData) {
          const buProduct = data
            .map(row => [row[0], row[1]])
            .filter(item => item[0] !== "Totals");
          localStorage.setItem("bu-product", JSON.stringify(buProduct));
        }
      }
  
      return data;
  
    } catch (error) {
      console.error('Error fetching performGetTotalsAll:', error);
      return null;
    }
};

export const performGetProductsRaw = async (globals, product) => {
    let url, response, options, data;
    let keyName = "";

    switch (globals.SHEET_ID) {
        case `1I5cdCL3k_h25DGzySpkQQuqsn0Rbuv-KafEEtVCgj3E`: keyName = `last-update-4w`; break;
        case `1zUZJJsqkKfs9Fu4gx5tOW9m216Kft5ucdoutcY02LEM`: keyName = `last-update-1w`; break;
        case `1j1SCJrBrYb8Dx5l6QkMB9SX7WMkV_ZzSZOCxs3Tm6Os`: keyName = `last-update-1d`; break;
        default: keyName = `CustomSheet`; break;
    }

    try {
        let storageKey;

        if (globals.SHEET_ID === "CUSTOM") {
            let datesChosen = localStorage.getItem(`datesChoosen`);
            datesChosen = datesChosen.split(`***`);
            let fromDate = datesChosen[0];
            let toDate = datesChosen[1];

            // Use local cache first
            storageKey = `performGetProductsRaw-${fromDate + '-' + toDate}-${product}`;
            const cachedData = localStorage.getItem(storageKey);
            if (cachedData) { return JSON.parse(cachedData); }

            // Real-time fetch via Lambda, same as antes:
            url = `https://affa4eakoyjyyfhzop56q4oprm0exspl.lambda-url.us-east-1.on.aws/`;
            const params = {
                product: product, 
                interval_from: fromDate,
                interval_to: toDate,
                totals: false,
            };

            options = {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(params),
                cache: 'no-store'
            };

            await sleep(500); 
            response = await fetch(url, options);
            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
            data = (await response.json()).message;
            data = convertDataToArray(data); // Deja este ETL si ya lo usas

            localStorage.setItem(storageKey, JSON.stringify(data));
        } else {
            console.log(`Getting info from S3 - ${keyName} - ${product}`);
            storageKey = `performGetProductsRaw-${globals.SHEET_ID}-${product}`;
            const cachedData = localStorage.getItem(storageKey);
            if (cachedData) { return JSON.parse(cachedData); }

            url = `https://olympus-cache.s3.amazonaws.com/${globals.SHEET_ID}/${product}.json`;

            options = {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store'
            };

            await sleep(500);

            try {
                response = await fetch(url, options);
                if (!response.ok) {
                    console.log(`No data found for ${keyName} (Product: ${product})`);
                    return null;
                } else {
                    const json = await response.json();
                    data = json.values;
                    localStorage.setItem(storageKey, JSON.stringify(data));
                }
            } catch (e) {
                console.log(`Error fetching ${keyName} S3 file: ${e}.`);
                return null;
            }
        }

        return data;

    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
};

export const performGetHistory = async (globals) => {
    const BUCKET_NAME = `olympus-cache`;
    const SHEET_ID = "1qkmQ2HJKXsLHkz52_XksERTXvHBY2dVqe7BdHD7dsso";
    const storageKey = `history-data`;

    try {
        const cachedData = localStorage.getItem(storageKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }

        const bucketUrl = `https://${BUCKET_NAME}.s3.amazonaws.com`;
        const prefix = SHEET_ID;
        const historyUrl = `${bucketUrl}/${prefix}/NewHistory.json`;

        const resp = await fetch(historyUrl, { cache: 'no-store' });
        if (!resp.ok) {
            throw new Error(`Could not fetch NewHistory.json: ${resp.status}`);
        }
        const historyJson = await resp.json();
        const data = historyJson.values;
        const productsData = localStorage.getItem("bu-product-history");
        if (!productsData) {
            localStorage.setItem(
                "bu-product-history",
                JSON.stringify(
                    data.map(row => [row[0], row[1]]).filter(item => item[0] !== "Totals")
                )
            );
        }

        localStorage.setItem(storageKey, JSON.stringify(data));
        return data;

    } catch (error) {
        console.error('Error fetching performGetHistoryFromBucket:', error);
        return null;
    }
};

export const performGetEscalations = async (globals) => {
    // Placeholder for now - will fetch from S3 later
    // For now, return empty array to make the page load
    console.log('[performGetEscalations] Placeholder - returning empty data');
    localStorage.setItem('escalations-history-data', JSON.stringify([]));
    return [];
};

export const performGetAutomations = async (globals) => {
    const BUCKET_NAME = `olympus-cache`;
    const SHEET_ID = "1qkmQ2HJKXsLHkz52_XksERTXvHBY2dVqe7BdHD7dsso";
    const storageKey = `automations-history-data`;

    try {
        const cachedData = localStorage.getItem(storageKey);
        if (cachedData) {
            console.error(`[performGetAutomations] Cached data found for ${storageKey}`);
            const data = JSON.parse(cachedData);

            // Ensure products list exists even when returning from cache
            const productsData = localStorage.getItem("bu-product-automations");
            if (!productsData && Array.isArray(data)) {
                localStorage.setItem(
                    "bu-product-automations",
                    JSON.stringify(
                        data.map(row => [row[0], row[1]]).filter(item => item[0] !== "Totals")
                    )
                );
            }
            return data;
        }

        console.error(`[performGetAutomations] fetching data from S3`);
        const bucketUrl = `https://${BUCKET_NAME}.s3.amazonaws.com`;
        const prefix = SHEET_ID;
        const automationsUrl = `${bucketUrl}/${prefix}/AutomationsHistory.json`;

        const resp = await fetch(automationsUrl, { cache: 'no-store' });
        if (!resp.ok) {
            throw new Error(`Could not fetch AutomationsHistory.json: ${resp.status}`);
        }
        const automationsJson = await resp.json();
        const data = automationsJson.values;

        // Optional: Cache products from automations if needed
        const productsData = localStorage.getItem("bu-product-automations");
        if (!productsData) {
            localStorage.setItem(
                "bu-product-automations",
                JSON.stringify(
                    data.map(row => [row[0], row[1]]).filter(item => item[0] !== "Totals")
                )
            );
        }

        localStorage.setItem(storageKey, JSON.stringify(data));
        return data;

    } catch (error) {
        console.error('Error fetching performGetAutomations:', error);
        return null;
    }
};

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/

export const handleFormSubmit = async (values, setApiResponse, setSubmitting, fetchUsers) => {

    const payload = {
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
        phone_number: values.contact,
        image_link: values.image,
        type: values.type || "Conductor",
    };

    let lambdaURL = `https://bxvliamvh57capj27ml5wlztfu0vypac.lambda-url.us-east-1.on.aws`;

    try {

        const options = {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                "Authorization": encryptSecret(globals.cs_ai_olympus_create_user_secret) 
            },
            body: JSON.stringify(payload),
            cache: 'no-store'
        };

        const response = await fetch(lambdaURL, options);

        if (response.ok) {
            setApiResponse({ message: "User created successfully", success: true });
            localStorage.removeItem('all-users');
            fetchUsers();  
        } else {
            setApiResponse({ message: "Failed to create user", success: false });
            console.error("Failed to create user");
        }
    } catch (error) {
        setApiResponse({ message: `Error: ${error.message}`, success: false });
        console.error("Error:", error);
    } finally {
        setSubmitting(false);
    }
};

export const saveGooglePhoto = async (payload) => {
    // const payload = {
    //   googleimage: 'https://lh3.googleusercontent.com/a/ACg8ocKESIzK8CdWG9n3MEWbs4VlN7kyfs-mm694nD_Cx5UXKemJgTc=s96-c',
    //   email: "xavier.villarroel@trilogy.com "
    // };
  
    try {
      const response = await fetch('https://bxvliamvh57capj27ml5wlztfu0vypac.lambda-url.us-east-1.on.aws/', {
        method: 'PUT',
        headers: { 
            "Content-Type": "application/json", 
            "Authorization": encryptSecret(globals.cs_ai_olympus_create_user_secret) 
        },
        body: JSON.stringify(payload),
        cache: 'no-store'
      });
  
      if (!response.ok) {
        console.error('Error in PUT request:', response.statusText);
      } else {
        // console.log('PUT request successful:', await response.json());
      }
    } catch (error) {
      console.error('Error making PUT request:', error);
    }
};

export const handleDeleteUsers = async (emails, setDeleteResponse, setSubmitting, fetchUsers) => {
    
    let lambdaURL = `https://bxvliamvh57capj27ml5wlztfu0vypac.lambda-url.us-east-1.on.aws`;

    try {
        for (const email of emails) {
            const response = await fetch(lambdaURL, {
                method: "DELETE",
                headers: { 
                    "Content-Type": "application/json", 
                    "Authorization": encryptSecret(globals.cs_ai_olympus_create_user_secret) 
                },
                body: JSON.stringify({ email }),
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(`Failed to delete user with email: ${email}`);
            }
        }
        setDeleteResponse({ message: "Selected users deleted successfully", success: true });
        
        localStorage.removeItem('all-users');
        fetchUsers();
        localStorage.removeItem('assignments');
        
    } catch (error) {
        setDeleteResponse({ message: `Error: ${error.message}`, success: false });
        console.error("Error:", error);
    } finally {
        setSubmitting(false);
    }
};

export const fetchUsers = async (setUsers = null) => {
    try {
        const allUsers = localStorage.getItem("all-users");
        if (allUsers) {
            if (setUsers) {
                setUsers(JSON.parse(allUsers)); // Solo ejecuta si setUsers es pasado
            }
        } else {
            const response = await fetch('https://bxvliamvh57capj27ml5wlztfu0vypac.lambda-url.us-east-1.on.aws/', {
                method: 'GET', 
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": encryptSecret(globals.cs_ai_olympus_create_user_secret) 
                },
                cache: 'no-store'
            });
            const data = await response.json();
            localStorage.setItem("all-users", JSON.stringify(data.message));
            
            if (setUsers) {
                setUsers(data.message); // Solo ejecuta si setUsers es pasado
            }
        }
    } catch (error) {
        console.error("Error fetching users:", error);
    }
};

export const fetchAssignments = async (globals) => {
    
    try {
      const storageKey = `assignments`;
      const cachedData = localStorage.getItem(storageKey);
  
      if (cachedData) {
        return JSON.parse(cachedData);
      }
  
      const url = `https://${globals.SHEET_API_URL}/11W21HKGz7oo_sCn3inX6LbrCGq7tjkug_hUG0Y3EN48/values/Assignments!B2:E?key=${globals.SHEET_KEY}`;

      let params = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json'},
        cache: 'no-store'
      };
  
      const response = await fetch(url, params);
  
      if (response.status === 429) { 
        alert("You've made too many requests. Please wait and try again later.");
        return null; 
      }
  
      if (!response.ok) { 
        throw new Error(`HTTP error! status: ${response.status}`); 
      }
  
      const data = await response.json();
      localStorage.setItem(storageKey, JSON.stringify(data.values)); 
      return data.values;

    } catch (error) {
      console.error('Error fetching assignments:', error);
      return null;
    }
};
  
export const updateAssignmentInSheet = async (globals, dataObject) => {
    try {
      const url = `https://${globals.SHEET_API_URL}/11W21HKGz7oo_sCn3inX6LbrCGq7tjkug_hUG0Y3EN48/values/Assignment!B2:E?key=${globals.SHEET_KEY}&valueInputOption=USER_ENTERED`;
      
      const values = dataObject.map(item => [
        item.product_id,
        item.bu,
        item.owner,
        item.type
      ]);
  
      const body = {
        range: "Assignment!B2:E",
        majorDimension: "ROWS",
        values
      };
  
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store'
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error updating assignment in Google Sheets:', error);
      throw error;
    }
};

export const validateUser = (userEmail) => {
    const allUsers = JSON.parse(localStorage.getItem("all-users"));
    if (!allUsers) { 
      return false 
    }
    let response = allUsers.some(user => user[2] === userEmail)
    return response;
};
 
/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/

// Reutilización de funciones auxiliares
function extractDateFromTabName(tabName) {
    if (tabName !== 'Stats') {
        const dateTimeString = tabName.replace('Sheet ', '');
        const [datePart, timePart] = dateTimeString.split(' ');
        const [day, month, year] = datePart.split('/');
        const [hour, minute] = timePart.split(':');
        return new Date(year, month - 1, day, hour, minute);
    } else {
        console.log(`This is stats: ${tabName}`);
    }
};

function findMostRecentTab(tabNames) {
    let mostRecentTab = tabNames[0];
    let mostRecentDate = extractDateFromTabName(tabNames[0]);

    for (let i = 1; i < tabNames.length; i++) {
        const currentDate = extractDateFromTabName(tabNames[i]);
        if (currentDate > mostRecentDate) {
            mostRecentTab = tabNames[i];
            mostRecentDate = currentDate;
        }
    }

    return mostRecentTab;
};

