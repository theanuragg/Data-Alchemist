import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

interface ValidationError {
  type: string;
  message: string;
  entityType: string;
  entityId?: string;
  field?: string;
  severity: 'error' | 'warning';
}

interface ValidationWarning {
  type: string;
  message: string;
  entityType: string;
  entityId?: string;
  field?: string;
}

interface ValidationSummary {
  totalErrors: number;
  totalWarnings: number;
  criticalErrors: number;
  entitiesWithErrors: number;
}

// Core validation functions
function validateClients(clients: any[], tasks: any[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const taskIds = new Set(tasks.map(t => t.TaskID));
  const clientIds = new Set();

  clients.forEach((client, index) => {
    // Check required fields
    if (!client.ClientID) {
      errors.push({
        type: 'missing_required_field',
        message: 'ClientID is required',
        entityType: 'clients',
        entityId: `row_${index}`,
        field: 'ClientID',
        severity: 'error'
      });
    }

    // Check duplicate IDs
    if (client.ClientID) {
      if (clientIds.has(client.ClientID)) {
        errors.push({
          type: 'duplicate_id',
          message: `Duplicate ClientID: ${client.ClientID}`,
          entityType: 'clients',
          entityId: client.ClientID,
          field: 'ClientID',
          severity: 'error'
        });
      }
      clientIds.add(client.ClientID);
    }

    // Validate PriorityLevel
    if (client.PriorityLevel && (client.PriorityLevel < 1 || client.PriorityLevel > 5)) {
      errors.push({
        type: 'out_of_range',
        message: 'PriorityLevel must be between 1 and 5',
        entityType: 'clients',
        entityId: client.ClientID,
        field: 'PriorityLevel',
        severity: 'error'
      });
    }

    // Validate RequestedTaskIDs
    if (client.RequestedTaskIDs) {
      const requestedTasks = client.RequestedTaskIDs.toString().split(',').map((id: string) => id.trim());
      requestedTasks.forEach((taskId: string) => {
        if (!taskIds.has(taskId)) {
          errors.push({
            type: 'unknown_reference',
            message: `Referenced TaskID ${taskId} does not exist`,
            entityType: 'clients',
            entityId: client.ClientID,
            field: 'RequestedTaskIDs',
            severity: 'error'
          });
        }
      });
    }

    // Validate AttributesJSON
    if (client.AttributesJSON) {
      try {
        JSON.parse(client.AttributesJSON);
      } catch (e) {
        errors.push({
          type: 'malformed_json',
          message: 'Invalid JSON in AttributesJSON',
          entityType: 'clients',
          entityId: client.ClientID,
          field: 'AttributesJSON',
          severity: 'error'
        });
      }
    }
  });

  return errors;
}

function validateWorkers(workers: any[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const workerIds = new Set();

  workers.forEach((worker, index) => {
    // Check required fields
    if (!worker.WorkerID) {
      errors.push({
        type: 'missing_required_field',
        message: 'WorkerID is required',
        entityType: 'workers',
        entityId: `row_${index}`,
        field: 'WorkerID',
        severity: 'error'
      });
    }

    // Check duplicate IDs
    if (worker.WorkerID) {
      if (workerIds.has(worker.WorkerID)) {
        errors.push({
          type: 'duplicate_id',
          message: `Duplicate WorkerID: ${worker.WorkerID}`,
          entityType: 'workers',
          entityId: worker.WorkerID,
          field: 'WorkerID',
          severity: 'error'
        });
      }
      workerIds.add(worker.WorkerID);
    }

    // Validate AvailableSlots
    if (worker.AvailableSlots) {
      try {
        const slots = JSON.parse(worker.AvailableSlots.toString().replace(/'/g, '"'));
        if (!Array.isArray(slots)) {
          throw new Error('Not an array');
        }
        slots.forEach((slot: any) => {
          if (!Number.isInteger(slot) || slot < 1) {
            throw new Error('Invalid slot number');
          }
        });
      } catch (e) {
        errors.push({
          type: 'malformed_list',
          message: 'AvailableSlots must be a valid array of positive integers',
          entityType: 'workers',
          entityId: worker.WorkerID,
          field: 'AvailableSlots',
          severity: 'error'
        });
      }
    }

    // Validate MaxLoadPerPhase
    if (worker.MaxLoadPerPhase && worker.MaxLoadPerPhase < 1) {
      errors.push({
        type: 'out_of_range',
        message: 'MaxLoadPerPhase must be at least 1',
        entityType: 'workers',
        entityId: worker.WorkerID,
        field: 'MaxLoadPerPhase',
        severity: 'error'
      });
    }
  });

  return errors;
}

function validateTasks(tasks: any[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const taskIds = new Set();

  tasks.forEach((task, index) => {
    // Check required fields
    if (!task.TaskID) {
      errors.push({
        type: 'missing_required_field',
        message: 'TaskID is required',
        entityType: 'tasks',
        entityId: `row_${index}`,
        field: 'TaskID',
        severity: 'error'
      });
    }

    // Check duplicate IDs
    if (task.TaskID) {
      if (taskIds.has(task.TaskID)) {
        errors.push({
          type: 'duplicate_id',
          message: `Duplicate TaskID: ${task.TaskID}`,
          entityType: 'tasks',
          entityId: task.TaskID,
          field: 'TaskID',
          severity: 'error'
        });
      }
      taskIds.add(task.TaskID);
    }

    // Validate Duration
    if (task.Duration && task.Duration < 1) {
      errors.push({
        type: 'out_of_range',
        message: 'Duration must be at least 1',
        entityType: 'tasks',
        entityId: task.TaskID,
        field: 'Duration',
        severity: 'error'
      });
    }

    // Validate MaxConcurrent
    if (task.MaxConcurrent && task.MaxConcurrent < 1) {
      errors.push({
        type: 'out_of_range',
        message: 'MaxConcurrent must be at least 1',
        entityType: 'tasks',
        entityId: task.TaskID,
        field: 'MaxConcurrent',
        severity: 'error'
      });
    }
  });

  return errors;
}

// AI-powered validation
async function aiValidation(data: any): Promise<ValidationError[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  
  const prompt = `
    Analyze the following data for potential issues and provide validation feedback:
    
    ${JSON.stringify(data, null, 2)}
    
    Look for:
    1. Data consistency issues
    2. Business logic violations
    3. Potential data quality problems
    4. Cross-entity relationship issues
    
    Return a JSON array of validation errors in this format:
    [
      {
        "type": "error_type",
        "message": "description",
        "entityType": "clients|workers|tasks",
        "entityId": "id_if_applicable",
        "field": "field_name_if_applicable",
        "severity": "error|warning"
      }
    ]
    
    Only return the JSON array, no other text.
  `;

  try {
    const result = await model.generateContent(prompt);
    let response = result.response.text();
    // Remove code block markers if present
    response = response.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    // Attempt to fix common JSON issues (single quotes, trailing commas)
    response = response.replace(/'/g, '"').replace(/,\s*([\]}])/g, '$1');
    try {
      return JSON.parse(response);
    } catch (parseError) {
      console.error('AI validation JSON parse error:', parseError, '\nResponse:', response);
      return [];
    }
  } catch (error) {
    console.error('AI validation error:', error);
    return [];
  }
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clients = [], workers = [], tasks = [] } = body;

    // Core validations
    const clientErrors = validateClients(clients, tasks);
    const workerErrors = validateWorkers(workers);
    const taskErrors = validateTasks(tasks);

    // AI-powered validation
    const aiErrors = await aiValidation({ clients, workers, tasks });

    // Combine all errors
    const allErrors = [...clientErrors, ...workerErrors, ...taskErrors, ...aiErrors];

    // Create summary
    const summary: ValidationSummary = {
      totalErrors: allErrors.filter(e => e.severity === 'error').length,
      totalWarnings: allErrors.filter(e => e.severity === 'warning').length,
      criticalErrors: allErrors.filter(e => ['duplicate_id', 'missing_required_field'].includes(e.type)).length,
      entitiesWithErrors: new Set(allErrors.map(e => e.entityId).filter(Boolean)).size
    };

    const result: ValidationResult = {
      isValid: allErrors.filter(e => e.severity === 'error').length === 0,
      errors: allErrors.filter(e => e.severity === 'error'),
      warnings: allErrors.filter(e => e.severity === 'warning'),
      summary
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}