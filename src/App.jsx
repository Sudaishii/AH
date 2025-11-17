import './App.css';
import Routing from './Routing';
import { ThemeProvider } from './Context/theme-provider';
import './index.css';

function App() {
  return (
    <ThemeProvider storageKey='theme'>
      <Routing />
    </ThemeProvider>
  );
}

export default App;
