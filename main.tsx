import { Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './app/globals.css';
import './app/arcade.css';
class AppBoundary extends Component<{children:ReactNode},{failed:boolean}>{
  state={failed:false};
  static getDerivedStateFromError(){return{failed:true};}
  render(){return this.state.failed?<main className="hub-loading"><h1>ما اكتمل تحميل اللعبة</h1><p>تحقق من الاتصال واسمح بالتخزين على هذا الجهاز.</p><button className="primary-button" onClick={()=>location.reload()}>حاول ثانية</button></main>:this.props.children;}
}
createRoot(document.getElementById('root')!).render(<AppBoundary><App/></AppBoundary>);
