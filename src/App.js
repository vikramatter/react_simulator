import "./App.css"
import React, { useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Settings, Battery, Database, Wind, X } from 'lucide-react';
import { days, months, years } from "./constants";

const ToolIcon = ({ type }) => {
  switch (type) {
    case 'turbine':
      return <Wind size={24} />;
    case 'battery':
      return <Battery size={24} />;
    case 'storage':
      return <Database size={24} />;
    default:
      return null;
  }
};

const App = () => {
  const [objects, setObjects] = useState([]);
  const [connections, setConnections] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [timeframe, setTimeframe] = useState('hourly');
  const [simulationData, setSimulationData] = useState([]);
  const workspaceRef = useRef(null);
  const [connecting, setConnecting] = useState(null);
const timeFramesLength={
  "hourly":24,
  "daily":7,
  "monthly":12,
  "annually":10}
  const tools = [
    { id: 'turbine', name: 'Turbine', type: 'turbine' },
    { id: 'battery', name: 'Battery', type: 'battery' },
    { id: 'storage', name: 'Storage', type: 'storage' }
  ];

  const handleDragStart = (e, tool) => {
    console.log(tool,"tools");
    e.dataTransfer.setData('tool', JSON.stringify(tool));
  };

  const handleDragInWorkspace=(e,obj)=>{
    let toolDragged=tools.find(tool => tool.type === obj.type);
    handleDragStart(e,toolDragged)
   console.log(toolDragged,"tooldragged")
  }
  const handleDrop = (e) => {
    e.preventDefault();
    const tool = JSON.parse(e.dataTransfer.getData('tool'));
    const rect = workspaceRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let dropArray=updateDropArray(objects,tool,x,y)
    setObjects(dropArray);
  };
  
  const updateDropArray = (objects, tool, x, y) => {
   
    const newElement = { ...tool, x, y, id: `${tool.id}-${Date.now()}` };
  
    // Check if an object with the same type exists
    const index = objects.findIndex(obj => obj.type === tool.type);
  
    if (index !== -1) {
      const updatedArray = [...objects];
      updatedArray[index] = newElement;
      return updatedArray;
    } else {
      return [...objects, newElement];
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    console.log("dragging");
  };

  const startConnection = (objectId) => {
    setConnecting(objectId);
  };

  const completeConnection = (targetId) => {
    if (connecting && connecting !== targetId) {
      setConnections([...connections, {
        source: connecting,
        target: targetId,
        id: `conn-${Date.now()}`
      }]);
    }
    setConnecting(null);
  };

  const removeObject = (id) => {
    setObjects(objects.filter(obj => obj.id !== id));
    setConnections(connections.filter(conn => 
      conn.source !== id && conn.target !== id
    ));
  };

  const startSimulation = () => {
    setIsSimulating(true);
   const length=timeFramesLength[timeframe];
   const timeOptions={7:days,12:months,10:years}
    setTimeout(() => {
      const mockData = Array.from({ length: length }, (_, i) => ({
        time: length==24?`${i}:00`:timeOptions[length],
        output: Math.random() * 100,
        efficiency: Math.random() * 80 + 20
      }));
      setSimulationData(mockData);
      setIsSimulating(false);
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-48 bg-white p-4 shadow-lg">
        <h2 className="text-lg font-bold mb-4">Tools</h2>
        {tools.map((tool) => (
          <div
            key={tool.id}
            draggable
            onDragStart={(e) => handleDragStart(e, tool)}
            className="flex items-center p-2 mb-2 bg-gray-50 rounded cursor-move hover:bg-gray-100"
          >
            <ToolIcon type={tool.type} />
            <span className="ml-2">{tool.name}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 p-4">
        <div className="flex justify-between mb-4">
          <button
            onClick={startSimulation}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={isSimulating}
          >
            {isSimulating ? (
              <span className="flex items-center">
                <Settings className="animate-spin mr-2" />
                Simulating...
              </span>
            ) : (
              'Start Simulation'
            )}
          </button>

          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
           
            <option value="monthly">Monthly</option>
            <option value="annually">Annually</option>
          </select>
        </div>

        <div
          ref={workspaceRef}
          className="h-96 bg-white rounded-lg shadow-inner relative mb-4"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {objects.map(obj => (
            <div
              key={obj.id}
              draggable
              onDragStart={(e) => handleDragInWorkspace(e, obj)}
              className="absolute cursor-move p-2 bg-gray-50 rounded shadow-sm"
              style={{ left: `${obj.x}px`, top: `${obj.y}px` }}
              onClick={() => connecting ? completeConnection(obj.id) : startConnection(obj.id)}
            >
              <div className="flex items-center">
                <ToolIcon type={obj.type} />
                <X 
                  className="ml-2 w-4 h-4 text-gray-500 hover:text-red-500 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeObject(obj.id);
                  }}
                />
              </div>
            </div>
          ))}

          <svg className="absolute inset-0 pointer-events-none">
            {connections.map(conn => {
              const source = objects.find(obj => obj.id === conn.source);
              const target = objects.find(obj => obj.id === conn.target);
              if (!source || !target) return null;
              return (
                <line
                  key={conn.id}
                  x1={source.x + 25}
                  y1={source.y + 25}
                  x2={target.x + 25}
                  y2={target.y + 25}
                  stroke="#666"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>

        {simulationData.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Simulation Results</h3>
            <LineChart width={800} height={300} data={simulationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="output" stroke="#8884d8" />
              <Line type="monotone" dataKey="efficiency" stroke="#82ca9d" />
            </LineChart>
          </div>
        )}
      </div>
    </div>
  ); 
};

export default App;