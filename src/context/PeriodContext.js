import React, { createContext, useState } from "react";

export const PeriodContext = createContext();

export const PeriodProvider = ({ children }) => {
    const [period, setPeriod] = useState(2); 

    return (
        <PeriodContext.Provider value={{ period, setPeriod }}>
            {children}
        </PeriodContext.Provider>
    );
};

// 0 = 1 day
// 1 = 1 week
// 2 = 4 week
