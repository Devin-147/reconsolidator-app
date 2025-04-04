// src/hooks/useTreatments.ts
import { useState, useEffect } from 'react';
import { TreatmentResult } from '@/types/recording';

export const useTreatments = () => {
    const [completedTreatments, setCompletedTreatments] = useState<TreatmentResult[]>([]);

    useEffect(() => {
        const savedTreatments = localStorage.getItem('completedTreatments');
        if (savedTreatments) {
            setCompletedTreatments(JSON.parse(savedTreatments));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('completedTreatments', JSON.stringify(completedTreatments));
    }, [completedTreatments]);

    const completeTreatment = (treatmentName: string, sudsScore: number) => {
        const treatmentIndex = completedTreatments.findIndex(t => t.treatmentNumber === parseInt(treatmentName));

        if (treatmentIndex >= 0) {
            const updatedTreatments = [...completedTreatments];
            updatedTreatments[treatmentIndex] = {
                ...updatedTreatments[treatmentIndex],
                finalSuds: sudsScore,
                completedAt: new Date().toISOString(), // Ensure this is valid
            };
            setCompletedTreatments(updatedTreatments);
        } else {
            setCompletedTreatments(prev => [
                ...prev,
                {
                    treatmentNumber: completedTreatments.length + 1,
                    finalSuds: sudsScore,
                    improvementPercentage: 0,
                    isImprovement: false,
                    completedAt: new Date().toISOString(), // Ensure this is valid
                }
            ]);
        }

        console.log(`Completed treatment: ${treatmentName} with SUDS score: ${sudsScore}`);
    };

    return { completedTreatments, completeTreatment };
};