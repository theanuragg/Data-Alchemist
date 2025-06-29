import { NextApiRequest, NextApiResponse } from 'next';

interface Priority {
  id: string;
  name: string;
  weight: number;
  description: string;
}

let priorities: Priority[] = [
  { id: 'priority_level', name: 'Priority Level', weight: 0.3, description: 'Client priority importance' },
  { id: 'task_fulfillment', name: 'Task Fulfillment', weight: 0.25, description: 'Requested tasks completion' },
  { id: 'workload_balance', name: 'Workload Balance', weight: 0.2, description: 'Fair distribution among workers' },
  { id: 'skill_match', name: 'Skill Matching', weight: 0.15, description: 'Best skill-task alignment' },
  { id: 'phase_preference', name: 'Phase Preference', weight: 0.1, description: 'Preferred phase scheduling' }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        res.status(200).json({ priorities });
        break;
        
      case 'POST':
        const { action, ...payload } = req.body;
        
        switch (action) {
          case 'updateWeights':
            const { weights } = payload;
            priorities = priorities.map(p => ({
              ...p,
              weight: weights[p.id] || p.weight
            }));
            res.status(200).json({ success: true, priorities });
            break;
            
          case 'setPreset':
            const { preset } = payload;
            type PriorityId = 'priority_level' | 'task_fulfillment' | 'workload_balance' | 'skill_match' | 'phase_preference';
            const presets: Record<string, Record<PriorityId, number>> = {
              'maximize_fulfillment': {
                priority_level: 0.4,
                task_fulfillment: 0.35,
                workload_balance: 0.1,
                skill_match: 0.1,
                phase_preference: 0.05
              },
              'fair_distribution': {
                priority_level: 0.2,
                task_fulfillment: 0.2,
                workload_balance: 0.4,
                skill_match: 0.15,
                phase_preference: 0.05
              },
              'minimize_workload': {
                priority_level: 0.15,
                task_fulfillment: 0.15,
                workload_balance: 0.5,
                skill_match: 0.15,
                phase_preference: 0.05
              },
              'skill_focused': {
                priority_level: 0.2,
                task_fulfillment: 0.2,
                workload_balance: 0.15,
                skill_match: 0.4,
                phase_preference: 0.05
              }
            };
            type PresetKey = keyof typeof presets;
            const presetKey = preset as PresetKey;
            
            if (presetKey in presets) {
              priorities = priorities.map(p => ({
                ...p,
                weight: presets[presetKey][p.id as PriorityId] ?? p.weight
              }));
              res.status(200).json({ success: true, priorities, preset });
            } else {
              res.status(400).json({ error: 'Invalid preset' });
            }
            break;
            
          default:
            res.status(400).json({ error: 'Invalid action' });
        }
        break;
        
      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Priorities API error:', error);
    res.status(500).json({ error: 'Priorities operation failed' });
  }
}