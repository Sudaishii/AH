import { NavLink } from 'react-router-dom';
import React, { forwardRef } from 'react';
import { Cn } from "../utils/cn.js";
import SugboWorks from "../assets/Logo.png";
import PropTypes from 'prop-types';
import { navbarLink } from '../constants/index.jsx'




export const Sidebar = forwardRef(({ collapsed }, ref) => {
    return (  
      <aside ref={ref} 
      className={Cn("fixed top-0 bottom-0 z-[50] flex h-full w-[250px] flex-col overflow-x-hidden border-r border-slate-300 bg-white [transition:_width_300ms_cubic-bezier(0.4,0,0.2,1),left_300ms_cubic-bezier(0.4,0,0.2,1),background-color_150ms_cubic-bezier(0.4,0,0.2,1),border_150ms_cubic-bezier(0.4,0,0.2,1)] dark:border-slate-700 dark:bg-slate-800",
      collapsed ? "md:w-[70px] md:items-center" : "md:w-[250px]",
       collapsed ? "max-md:-left-full" :  "max-md:left-0",
      )} 
      >
            <div className="flex gap-x-1 align-items" style={{ paddingLeft: collapsed ? "0px" : "0.5rem", paddingTop: "0.5rem", alignItems: "center"}}>
              
              <img src={SugboWorks} alt="Logo" className='w-16 h-16 pt-2 dark:hidden' style={{ verticalAlign: 'middle' }}/>
              <img src={SugboWorks} alt="Logo" className='w-16 h-16 pt-2 hidden dark:block' style={{ verticalAlign: 'middle' }}/>

              
              {!collapsed && (
                    <p style={{paddingBottom: "5px"}} className="text-lg font-medium text-slate-900 transition-colors dark:text-slate-50 mt-2">
                      SugboWorks
                    </p>
              )}
            </div>

          <div style={{marginTop: "2rem"}}  className='flex w-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden p-3 [scrollbar-width:_thin]'>
                 {navbarLink.map((navbarLink) => (
                        <nav 
                          key={navbarLink.title}
                          className={Cn("sidebar-group",
                            collapsed && "md:items-center", collapsed && "md:items-center"

                          )}
                           style={{paddingLeft: collapsed ? "0rem" : "1rem", paddingRight: collapsed ? "0rem" : "1rem"}}                             
                        >

                          <p className={Cn("sidebar-group-title", collapsed && "md:w-[45px] ")}>{navbarLink.title}</p>
                          {navbarLink.links.map((links) => (
                                <NavLink
                                  key={links.label}
                                  to={links.path}
                                  className={Cn("sidebar-item",  collapsed && "md:w-[45px] ")}
                                  style={{paddingLeft: collapsed? ".7rem" : ".5rem", paddingRight: "0rem"}}  
                                  
                                >
                                    <links.icon
                                        size={22}
                                        className="flex-shrink-0 "
                                        
                                    />
                                    {!collapsed && <p className='whitespace-nowrap'>{links.label}</p>}
                                </NavLink>
                        ))}

                        </nav>
                 ))}
          </div>
      </aside>
    );
      

      });
Sidebar.displayName = "Sidebar";

Sidebar.propTypes = {
  collapsed: PropTypes.bool,
};