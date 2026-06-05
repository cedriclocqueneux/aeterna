package services

import (
	"github.com/alpyxn/aeterna/backend/internal/config/common"
)

type AppModule struct{}

func (AppModule) Name() string { return "AppModule" }
func (AppModule) Section() string {
	return "app"
}

func init() {
	common.Register(AppModule{})
}

type AppSection struct {
	Env         string
	PlausibleURL string
}

func (AppModule) LoadAndValidate() (AppSection, error) {
	return AppSection{
		Env:         common.GetenvTrim("ENV"),
		PlausibleURL: common.GetenvTrim("PLAUSIBLE_URL"),
	}, nil
}
