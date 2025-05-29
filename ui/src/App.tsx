// import { ApiExample } from './components/ApiExample';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LoginPage from './components/auth/login';

const websiteBasename = import.meta.env.BASE_URL;

function App() {
  return (
    <BrowserRouter basename={websiteBasename}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
  // return (
  //   <>
  //     <LoginPage />
  //     <div className="card">
  //       <ApiExample />
  //     </div>
  //   </>
  // );
}

export default App;
