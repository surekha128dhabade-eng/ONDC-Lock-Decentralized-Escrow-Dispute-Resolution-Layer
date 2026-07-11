import { useState, useEffect } from 'react';
import { rpcServer } from './soroban';

export interface ContractEvent {
  type: string;
  contractId: string;
  topic: string[];
  data: any;
  ledger: number;
}

export const useSorobanEvents = (contractIds: string[]) => {
  const [events, setEvents] = useState<ContractEvent[]>([]);

  useEffect(() => {
    if (contractIds.length === 0) return;
    
    let lastLedger = 0;
    
    const fetchEvents = async () => {
      try {
        // In a real app we'd fetch the latest ledger first
        const latestLedger = (await rpcServer.getLatestLedger()).sequence;
        
        // Start from a bit in the past if we don't have a lastLedger
        const startLedger = lastLedger === 0 ? latestLedger - 100 : lastLedger + 1;
        
        if (startLedger > latestLedger) return;

        const request = {
          startLedger,
          filters: contractIds.map(id => ({
            type: 'contract' as const,
            contractIds: [id],
            topics: [] // All topics
          }))
        };

        const response = await rpcServer.getEvents(request);
        
        if (response.events && response.events.length > 0) {
          const parsedEvents = response.events.map(e => ({
            type: e.type,
            contractId: e.contractId ? e.contractId.toString() : 'Unknown',
            topic: e.topic.map(t => t.toXDR('base64')), // Simplified topics
            data: e.value.toXDR('base64'), // Simplified data
            ledger: e.ledger
          }));
          
          setEvents(prev => [...parsedEvents, ...prev].slice(0, 50)); // Keep last 50
        }
        
        lastLedger = latestLedger;
      } catch (err) {
        console.error("Error fetching Soroban events:", err);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    
    return () => clearInterval(interval);
  }, [contractIds]);

  return events;
};
