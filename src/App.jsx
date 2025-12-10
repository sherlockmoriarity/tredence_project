import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Play, Trash2, Save, Upload } from 'lucide-react';

// Mock API
const mockAPI = {
  getAutomations: async () => [
    { id: 'send_email', label: 'Send Email', params: ['to', 'subject', 'body'] },
    { id: 'generate_doc', label: 'Generate Document', params: ['template', 'recipient'] },
    { id: 'create_ticket', label: 'Create Ticket', params: ['system', 'priority'] },
  ],
  simulate: async (workflow) => {
    await new Promise(r => setTimeout(r, 1000));
    const steps = workflow.nodes.map((node, i) => ({
      nodeId: node.id,
      title: node.data.label,
      status: 'completed',
      timestamp: new Date(Date.now() + i * 1000).toISOString(),
    }));
    return { success: true, steps };
  },
};

// Custom Node Components
const CustomNode = ({ data, selected }) => (
  <div
    style={{
      padding: '12px 16px',
      borderRadius: '8px',
      border: `2px solid ${selected ? '#3b82f6' : '#e5e7eb'}`,
      background: data.color || '#fff',
      minWidth: '160px',
      boxShadow: selected ? '0 4px 6px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.1)',
    }}
  >
    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
      {data.label}
    </div>
    {data.subtitle && (
      <div style={{ fontSize: '12px', color: '#6b7280' }}>{data.subtitle}</div>
    )}
  </div>
);

const nodeTypes = {
  start: CustomNode,
  task: CustomNode,
  approval: CustomNode,
  automated: CustomNode,
  end: CustomNode,
};

// Node Configuration Panel
const NodeConfigPanel = ({ node, onUpdate, onDelete, automations }) => {
  if (!node) return null;

  const updateData = (field, value) => {
    onUpdate(node.id, { ...node.data, [field]: value });
  };

  const updateMetadata = (key, value, index) => {
    const metadata = [...(node.data.metadata || [])];
    metadata[index] = { key, value };
    updateData('metadata', metadata);
  };

  const addMetadata = () => {
    updateData('metadata', [...(node.data.metadata || []), { key: '', value: '' }]);
  };

  return (
    <div style={{ 
      position: 'absolute', 
      right: 0, 
      top: 0, 
      width: '320px', 
      height: '100%',
      background: '#fff',
      borderLeft: '1px solid #e5e7eb',
      overflowY: 'auto',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Configure Node</h3>
        <button
          onClick={() => onDelete(node.id)}
          style={{
            padding: '6px',
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
          Type
        </label>
        <input
          type="text"
          value={node.type}
          disabled
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            background: '#f9fafb',
          }}
        />
      </div>

      {/* Common Fields */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
          Title *
        </label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={(e) => updateData('label', e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
          }}
        />
      </div>

      {/* Task Node Fields */}
      {node.type === 'task' && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              value={node.data.description || ''}
              onChange={(e) => updateData('description', e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
              }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
              Assignee
            </label>
            <input
              type="text"
              value={node.data.assignee || ''}
              onChange={(e) => updateData('assignee', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
              }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
              Due Date
            </label>
            <input
              type="date"
              value={node.data.dueDate || ''}
              onChange={(e) => updateData('dueDate', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
              }}
            />
          </div>
        </>
      )}

      {/* Approval Node Fields */}
      {node.type === 'approval' && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
              Approver Role
            </label>
            <select
              value={node.data.approverRole || 'Manager'}
              onChange={(e) => updateData('approverRole', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
              }}
            >
              <option value="Manager">Manager</option>
              <option value="HRBP">HRBP</option>
              <option value="Director">Director</option>
              <option value="VP">VP</option>
            </select>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
              Auto-approve Threshold
            </label>
            <input
              type="number"
              value={node.data.threshold || 0}
              onChange={(e) => updateData('threshold', parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
              }}
            />
          </div>
        </>
      )}

      {/* Automated Step Fields */}
      {node.type === 'automated' && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
              Action
            </label>
            <select
              value={node.data.actionId || ''}
              onChange={(e) => {
                const action = automations.find(a => a.id === e.target.value);
                updateData('actionId', e.target.value);
                updateData('actionLabel', action?.label);
                updateData('params', {});
              }}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
              }}
            >
              <option value="">Select action...</option>
              {automations.map(a => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </div>
          {node.data.actionId && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '12px' }}>
                Parameters
              </label>
              {automations.find(a => a.id === node.data.actionId)?.params.map(param => (
                <div key={param} style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
                    {param}
                  </label>
                  <input
                    type="text"
                    value={node.data.params?.[param] || ''}
                    onChange={(e) => updateData('params', { ...node.data.params, [param]: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* End Node Fields */}
      {node.type === 'end' && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
              End Message
            </label>
            <textarea
              value={node.data.message || ''}
              onChange={(e) => updateData('message', e.target.value)}
              rows={2}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
              }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={node.data.showSummary || false}
                onChange={(e) => updateData('showSummary', e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Show Summary
            </label>
          </div>
        </>
      )}

      {/* Metadata for Start Node */}
      {node.type === 'start' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
            Metadata
          </label>
          {(node.data.metadata || []).map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="Key"
                value={m.key}
                onChange={(e) => updateMetadata(e.target.value, m.value, i)}
                style={{ flex: 1, padding: '6px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px' }}
              />
              <input
                type="text"
                placeholder="Value"
                value={m.value}
                onChange={(e) => updateMetadata(m.key, e.target.value, i)}
                style={{ flex: 1, padding: '6px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px' }}
              />
            </div>
          ))}
          <button
            onClick={addMetadata}
            style={{
              padding: '6px 12px',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            + Add Metadata
          </button>
        </div>
      )}
    </div>
  );
};

// Main App
export default function HRWorkflowDesigner() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [automations, setAutomations] = useState([]);
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  React.useEffect(() => {
    mockAPI.getAutomations().then(setAutomations);
  }, []);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeData = useCallback((nodeId, data) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data } : node
      )
    );
    setSelectedNode((sel) => sel?.id === nodeId ? { ...sel, data } : sel);
  }, [setNodes]);

  const deleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  const addNode = (type) => {
    const colors = {
      start: '#86efac',
      task: '#93c5fd',
      approval: '#fcd34d',
      automated: '#c084fc',
      end: '#fb7185',
    };

    const newNode = {
      id: `${type}_${Date.now()}`,
      type,
      position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        color: colors[type],
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const simulateWorkflow = async () => {
    setIsSimulating(true);
    setShowSimulation(true);
    try {
      const workflow = { nodes, edges };
      const result = await mockAPI.simulate(workflow);
      setSimulationResult(result);
    } catch (error) {
      setSimulationResult({ success: false, error: error.message });
    }
    setIsSimulating(false);
  };

  const exportWorkflow = () => {
    const workflow = { nodes, edges };
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    a.click();
  };

  const importWorkflow = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const workflow = JSON.parse(event.target.result);
        setNodes(workflow.nodes || []);
        setEdges(workflow.edges || []);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: '#1f2937',
        color: '#fff',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>HR Workflow Designer</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={exportWorkflow}
            style={{
              padding: '8px 16px',
              background: '#374151',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Save size={16} /> Export
          </button>
          <label style={{
            padding: '8px 16px',
            background: '#374151',
            color: '#fff',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <Upload size={16} /> Import
            <input type="file" accept=".json" onChange={importWorkflow} style={{ display: 'none' }} />
          </label>
          <button
            onClick={simulateWorkflow}
            disabled={nodes.length === 0}
            style={{
              padding: '8px 16px',
              background: nodes.length === 0 ? '#6b7280' : '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: nodes.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Play size={16} /> Simulate
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: '200px',
          background: '#f9fafb',
          borderRight: '1px solid #e5e7eb',
          padding: '20px',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Node Types</h3>
          {['start', 'task', 'approval', 'automated', 'end'].map((type) => {
            const colors = {
              start: '#86efac',
              task: '#93c5fd',
              approval: '#fcd34d',
              automated: '#c084fc',
              end: '#fb7185',
            };
            return (
              <button
                key={type}
                onClick={() => addNode(type)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '8px',
                  background: colors[type],
                  border: '2px solid #fff',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#000',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {/* Config Panel */}
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onUpdate={updateNodeData}
            onDelete={deleteNode}
            automations={automations}
          />
        )}
      </div>

      {/* Simulation Modal */}
      {showSimulation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
              Workflow Simulation
            </h2>
            {isSimulating ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Simulating workflow...</div>
            ) : simulationResult ? (
              <div>
                {simulationResult.success ? (
                  <div>
                    <div style={{ marginBottom: '16px', color: '#10b981', fontWeight: 500 }}>
                      ✓ Workflow completed successfully
                    </div>
                    <div style={{ fontSize: '14px' }}>
                      {simulationResult.steps.map((step, i) => (
                        <div key={i} style={{
                          padding: '12px',
                          background: '#f9fafb',
                          borderRadius: '6px',
                          marginBottom: '8px',
                        }}>
                          <div style={{ fontWeight: 500 }}>{step.title}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            {step.status} • {new Date(step.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#ef4444' }}>Error: {simulationResult.error}</div>
                )}
              </div>
            ) : null}
            <button
              onClick={() => setShowSimulation(false)}
              style={{
                marginTop: '20px',
                padding: '8px 16px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}