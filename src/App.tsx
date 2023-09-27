import React from 'react';
import { CloseCircleOutlined, SmileOutlined, TeamOutlined, ApartmentOutlined, PoweroffOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, MenuProps, Result, Spin, Typography } from 'antd';
import Companies from './Companies';

const { Paragraph, Text } = Typography;
const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const getItem = (
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group',
): MenuItem  => {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

const MenuItems = [
  getItem('Companies', 'companies', <ApartmentOutlined/>),
  getItem('Users', 'users', <TeamOutlined/>)
];

const App = () => {
  const [web3Account, setWeb3Account] = React.useState<string|undefined>(undefined);
  const [view, setView] = React.useState<string>('companies');

  const loadWalletConfiguration = async () => {
    if (window.ethereum) {
      try {
        const account: any = await window.ethereum.request({method: 'eth_requestAccounts'});
        if (account.length > 0) setWeb3Account(account[0])
      } catch (error) {
        console.log(error);
        setWeb3Account(undefined);
      }
    }
  }

  const onMenuClick = (e: any) => {
    console.log(e.key);
    setView(e.key);
  }

  React.useEffect(() => {
    const selectAddress = window.ethereum?.selectedAddress;
    setWeb3Account(selectAddress);
  }, []);

  return (
    <Layout hasSider>
      {
        (window as any).ethereum &&
        <React.Fragment>
          <Sider
            style={{
              overflow: 'auto',
              height: '100vh',
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
            }}
          >
            <div className="logo-vertical">
              <img src={require('./assets/PaltBlock_Logo.png')} width={100} height={'auto'}/>
            </div>
            <Menu
              theme="dark"
              onClick={onMenuClick}
              defaultSelectedKeys={['0']}
              mode="inline"
              items={MenuItems}
            />
          </Sider>
          <Layout className="site-layout" style={{ marginLeft: 200 }}>
            {/* <Header style={{ padding: 0, backgroundColor: '#f5f5f5' }}>
              PaltBlock
            </Header> */}
            <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
              {
                !web3Account ?
                <Result
                  icon={<SmileOutlined />}
                  title="Hi, you have need access your eth account!"
                  extra={<Button type="primary" onClick={loadWalletConfiguration}>Connect Metamask</Button>}
                />
                :
                <React.Fragment>
                  {  view === 'companies' && <Companies web3Account={web3Account}/> }
                  { 
                    view === 'users' && 
                    <div>not implement</div> 
                  }
                </React.Fragment>
              }
            </Content>
            <Footer style={{ textAlign: 'center' }}>PaltBlock ©2023 Created by Cosmos PB</Footer>
          </Layout>
          {/* {web3Account} */}
        </React.Fragment>
        ||
        <Content>
          <Result
            status="error"
            title="Access denied" 
            subTitle="Please check and modify the following information before acccess."
          >
            <div className="desc">
              <Paragraph>
                <Text
                  strong
                  style={{
                    fontSize: 16,
                  }}
                >
                  You access has the following error:
                </Text>
              </Paragraph>
              <Paragraph>
                <CloseCircleOutlined className="site-result-demo-error-icon" /> Please check and install <a href='https://support.metamask.io/hc/en-us/articles/360015489531-Getting-started-with-MetaMask' target='blank'>Metamask&gt;</a>
              </Paragraph>
            </div>
          </Result>
        </Content>
      }
    </Layout>
  );
}

export default App;
