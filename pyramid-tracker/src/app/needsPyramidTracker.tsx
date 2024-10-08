import React, { useState, useMemo, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const LEVELS = ['Survival', 'Security', 'Happiness', 'Achievement', 'Experience', 'Self Actualization'] as const;
const COLORS = ['#FF6B6B', '#FFA06B', '#FECA57', '#48DBFB', '#54A0FF', '#5F27CD'];
const DESCRIPTIONS: Record<typeof LEVELS[number], string> = {
  'Survival': "Basic needs for physical survival and biological functioning.",
  'Security': "Safety, stability, and freedom from fear.",
  'Happiness': "Feelings of joy, contentment, and positive emotions.",
  'Achievement': "Accomplishment of goals and recognition of efforts.",
  'Experience': "Learning, growth, and accumulation of life experiences.",
  'Self Actualization': "Realizing personal potential, self-fulfillment, seeking personal growth and peak experiences."
};

interface Snapshot {
  date: string;
  values: number[];
  userName: string;
}

const NeedsPyramidTracker: React.FC = () => {
  const [levelValues, setLevelValues] = useState<number[]>(LEVELS.map(() => 50));
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    // Load data from localStorage on component mount
    const savedLevelValues = localStorage.getItem('needsPyramidValues');
    const savedHistory = localStorage.getItem('needsPyramidHistory');
    const savedUserName = localStorage.getItem('needsPyramidUserName');
    
    if (savedLevelValues) {
      setLevelValues(JSON.parse(savedLevelValues));
    }
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    if (savedUserName) {
      setUserName(savedUserName);
    }
  }, []);

  useEffect(() => {
    // Save level values to localStorage whenever they change
    localStorage.setItem('needsPyramidValues', JSON.stringify(levelValues));
  }, [levelValues]);

  useEffect(() => {
    // Save user name to localStorage whenever it changes
    localStorage.setItem('needsPyramidUserName', userName);
  }, [userName]);

  const handleSliderChange = (index: number, value: number[]) => {
    setLevelValues(prev => {
      const newValues = [...prev];
      newValues[index] = value[0];
      return newValues;
    });
  };

  const saveSnapshot = () => {
    const newSnapshot: Snapshot = {
      date: new Date().toISOString(),
      values: [...levelValues],
      userName: userName
    };
    const updatedHistory = [...history, newSnapshot];
    setHistory(updatedHistory);
    localStorage.setItem('needsPyramidHistory', JSON.stringify(updatedHistory));
  };

  const resetData = () => {
    if (window.confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      setLevelValues(LEVELS.map(() => 50));
      setHistory([]);
      setUserName('');
      localStorage.removeItem('needsPyramidValues');
      localStorage.removeItem('needsPyramidHistory');
      localStorage.removeItem('needsPyramidUserName');
    }
  };

  const pyramidData = useMemo(() => 
    LEVELS.map((level, index) => ({
      props: {
        style: {
          backgroundColor: COLORS[index],
          border: '1px solid #000',
          cursor: 'pointer',
        },
        className: 'relative flex items-center justify-center transition-all duration-300 ease-in-out',
        onClick: () => setSelectedLevel(index),
      },
      content: level,
      width: levelValues[index],
    })),
    [levelValues]
  );
  const Pyramid = ({ data }: { data: typeof pyramidData }) => {
    return (
      <div className="relative w-full aspect-square">
        {data.map((item: { props: any; content: string; width: number }, index: number) => {
          const width = `${item.width}%`;
          const height = `${100 / data.length}%`;
          const marginLeft = `${(100 - item.width) / 2}%`;
          
          return (
            <div
              key={item.content}
              {...item.props}
              style={{
                ...item.props.style,
                width,
                height,
                marginLeft,
                position: 'absolute',
                bottom: `${index * (100 / data.length)}%`,
              }}
            >
              <span className="text-xs font-semibold text-white">{item.content}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const HistoryChart = () => {
    const chartData = history.map(snapshot => ({
      date: new Date(snapshot.date).toLocaleDateString(),
      userName: snapshot.userName || 'Unknown',
      ...LEVELS.reduce((acc, level, index) => {
        acc[level] = snapshot.values[index];
        return acc;
      }, {} as Record<string, number>)
    }));

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">History for {userName || 'Unknown User'}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-2 border rounded shadow">
                    <p className="font-bold">{`Date: ${label}`}</p>
                    <p>{`User: ${payload[0].payload.userName}`}</p>
                    {payload.map((entry, index) => (
                      <p key={index} style={{ color: entry.color }}>
                        {`${entry.name}: ${entry.value}`}
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }} />
            <Legend />
            {LEVELS.map((level, index) => (
              <Line key={level} type="monotone" dataKey={level} stroke={COLORS[index]} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Needs Pyramid Tracker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Input 
            type="text" 
            placeholder="Enter your name" 
            value={userName} 
            onChange={(e) => setUserName(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={saveSnapshot} disabled={!userName.trim()}>Save Snapshot</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full aspect-square max-w-md mx-auto">
            <Pyramid data={pyramidData} />
          </div>
          <div className="space-y-4">
            {LEVELS.map((level, index) => (
              <div key={level} className="space-y-2">
                <label className="text-sm font-medium" style={{ color: COLORS[index] }}>
                  {level}
                </label>
                <Slider
                  value={[levelValues[index]]}
                  onValueChange={(value) => handleSliderChange(index, value)}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-gray-600">{DESCRIPTIONS[level]}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center space-x-4">
          <Button onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? 'Hide History' : 'Show History'}
          </Button>
          <Button onClick={resetData} variant="destructive">Reset Data</Button>
        </div>
        {showHistory && <HistoryChart />}
      </CardContent>

      <Dialog open={selectedLevel !== null} onOpenChange={() => setSelectedLevel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: selectedLevel !== null ? COLORS[selectedLevel] : '' }}>
              {selectedLevel !== null ? LEVELS[selectedLevel] : ''}
            </DialogTitle>
          </DialogHeader>


          <DialogDescription>
            {selectedLevel !== null && (
              <>
                <p className="mb-4">{DESCRIPTIONS[LEVELS[selectedLevel]]}</p>
                <div className="space-y-4">
                  <Slider
                    value={[levelValues[selectedLevel]]}
                    onValueChange={(value) => handleSliderChange(selectedLevel, value)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-center">
                    Current Value: {levelValues[selectedLevel]}%
                  </div>
                </div>
              </>
            )}
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default NeedsPyramidTracker;